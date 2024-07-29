defmodule FieldPublication.Processing.OpenSearch do
  alias Phoenix.PubSub

  alias FieldPublication.OpenSearchService
  alias FieldPublication.Publications

  alias FieldPublication.Publications.{
    Data,
    Search
  }

  alias FieldPublication.DatabaseSchema.Publication

  require Logger

  @ignored_documents ["project", "configuration"]

  def evaluate_state(%Publication{} = publication) do
    database_count = Data.get_doc_count(publication)

    # We do not count documents 'project' or 'configuration' because they are not added to the index.
    database_count =
      if database_count >= 2, do: database_count - Enum.count(@ignored_documents), else: 0

    index_count = OpenSearchService.get_doc_count(publication)

    %{
      counter: index_count,
      percentage: index_count / database_count * 100,
      overall: database_count
    }
  end

  def index(%Publication{} = publication) do
    publication_id = Publications.get_doc_id(publication)
    publication_configuration = Publications.get_configuration(publication)

    mapping = Search.generate_index_mapping(publication)
    special_input_types = Search.evaluate_input_types(publication)

    {:ok, %{status: 200}} = OpenSearchService.reset_inactive_index(publication, mapping)

    initial_state =
      publication
      |> evaluate_state()
      # We will re-index in a moment, so set the state for counter and percentage accordingly
      |> Map.put(:counter, 0)
      |> Map.put(:percentage, 0)

    {:ok, counter_pid} =
      Agent.start_link(fn -> initial_state end)

    PubSub.broadcast(
      FieldPublication.PubSub,
      publication_id,
      {
        :search_index_processing_count,
        initial_state
      }
    )

    publication
    |> Publications.Data.get_doc_stream_for_all()
    |> Stream.reject(fn %{"_id" => id} ->
      id in @ignored_documents
    end)
    |> Stream.reject(fn doc ->
      # Reject all documents marked as deleted
      Map.get(doc, "deleted", false)
    end)
    |> Stream.map(
      &Search.prepare_doc_for_indexing(
        &1,
        publication,
        publication_configuration,
        special_input_types
      )
    )
    |> Stream.chunk_every(100)
    |> Enum.map(fn doc_batch ->
      batch_size = Enum.count(doc_batch)

      OpenSearchService.post(doc_batch, publication)
      |> case do
        {:ok, %{status: 200}} ->
          :ok

        {:ok, %{status: 400, body: body}} ->
          body
          |> Jason.decode!()
          |> inspect()
          |> Logger.error()

          :error
      end

      updated_state =
        Agent.get_and_update(counter_pid, fn %{counter: counter, overall: overall} = state ->
          state =
            state
            |> Map.put(:counter, counter + batch_size)
            |> Map.put(:percentage, (counter + batch_size) / overall * 100)

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
    end)
    |> Enum.to_list()

    OpenSearchService.switch_active_alias(publication)
    Search.update_label_usage()
  end
end
