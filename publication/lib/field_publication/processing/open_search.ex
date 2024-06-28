defmodule FieldPublication.Processing.OpenSearch do
  alias Phoenix.PubSub

  alias FieldPublication.CouchService
  alias FieldPublication.OpensearchService
  alias FieldPublication.Publications
  alias FieldPublication.Publications.Data
  alias FieldPublication.DocumentSchema.Publication

  require Logger

  def evaluate_state(%Publication{} = publication) do
    doc_count =
      CouchService.get_database(publication.database)
      |> then(fn {:ok, %{status: 200, body: body}} ->
        count =
          Jason.decode!(body)
          |> Map.get("doc_count", 0)

        # We do not count documents 'project' or 'configuration'.
        if count >= 2, do: count - 2, else: 0
      end)

    counter = OpensearchService.get_doc_count(publication)

    %{
      counter: counter,
      percentage: counter / doc_count * 100,
      overall: doc_count
    }
  end

  def index(%Publication{} = publication) do
    publication_id = Publications.get_doc_id(publication)

    config = Data.get_configuration(publication)

    {:ok, %{status: 200}} = OpensearchService.reset_inactive_index(publication)

    {:ok, counter_pid} =
      Agent.start_link(fn ->
        publication
        |> evaluate_state()
        # We will re-index in a moment, so set the state for counter and percentage accordingly
        |> Map.put(:counter, 0)
        |> Map.put(:percentage, 0)
      end)

    publication
    |> Publications.Data.get_doc_stream_for_all()
    |> Stream.reject(fn %{"_id" => id} ->
      id in ["project", "configuration"]
    end)
    |> Stream.reject(fn doc ->
      # Reject all documents marked as deleted
      Map.get(doc, "deleted", false)
    end)
    |> Stream.map(fn doc ->
      doc
      |> Map.put("id", doc["_id"])
      |> Map.delete("_id")
    end)
    |> Task.async_stream(
      fn %{"resource" => res} = doc ->
        full_doc =
          Data.apply_project_configuration(doc, config, publication)

        open_search_doc =
          %{
            "category" => res["category"],
            "id" => res["id"],
            "identifier" => res["identifier"],
            "publication_draft_date" => publication.draft_date,
            "project_name" => publication.project_name,
            "full_doc" => full_doc,
            "full_doc_as_text" => Jason.encode!(full_doc)
          }

        OpensearchService.put(open_search_doc, publication)
        |> case do
          {:ok, %{status: 201}} ->
            :ok

          {:ok, %{status: 400, body: body}} ->
            body
            |> Jason.decode!()
            |> Logger.error()

            :error
        end

        updated_state =
          Agent.get_and_update(counter_pid, fn %{counter: counter, overall: overall} = state ->
            state =
              state
              |> Map.put(:counter, counter + 1)
              |> Map.put(:percentage, (counter + 1) / overall * 100)

            {state, state}
          end)

        PubSub.broadcast(
          FieldPublication.PubSub,
          publication_id,
          {
            :search_index_processing_count,
            updated_state
          }
        )
      end,
      timeout: 1000 * 10
    )
    |> Enum.to_list()

    OpensearchService.switch_active_alias(publication)
  end
end
