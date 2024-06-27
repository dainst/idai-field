defmodule FieldPublication.Processing.OpenSearch do
  alias Phoenix.PubSub

  alias FieldPublication.OpenSearchService
  alias FieldPublication.Publications

  alias FieldPublication.Publications.{
    Data,
    Search
  }

  alias FieldPublication.DocumentSchema.Publication

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
    publication_configuration = Data.get_configuration(publication)

    mapping = Search.generate_index_mapping(publication)

    %{
      single_keyword_fields: single_keyword_fields,
      multi_keyword_fields: multi_keyword_fields
    } = Search.evaluate_input_types(publication)

    {:ok, %{status: 200}} = OpenSearchService.reset_inactive_index(publication, mapping)

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
      id in @ignored_documents
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
          Data.apply_project_configuration(doc, publication_configuration, publication)

        base_document =
          %{
            "category" => res["category"],
            "id" => res["id"],
            "identifier" => res["identifier"],
            "publication_draft_date" => publication.draft_date,
            "project_name" => publication.project_name,
            "full_doc" => full_doc,
            "full_doc_as_text" => Jason.encode!(full_doc)
          }

        additional_fields =
          single_keyword_fields
          |> Stream.filter(fn {category_name, _field_name} ->
            category_name == res["category"]
          end)
          |> Stream.map(fn {_this_category, field_name} ->
            {"#{field_name}_keyword", Map.get(res, field_name)}
          end)
          |> Stream.reject(fn {_field_name, value} ->
            value == nil
          end)
          |> Enum.into(%{})

        additional_fields_2 =
          multi_keyword_fields
          |> Stream.filter(fn {category_name, _field_name} ->
            category_name == res["category"]
          end)
          |> Stream.map(fn {_this_category, field_name} ->
            value_list =
              Map.get(res, field_name)
              |> case do
                values when is_list(values) ->
                  values

                values when is_map(values) ->
                  Map.values(values)

                nil ->
                  nil
              end

            {"#{field_name}_keyword", value_list}
          end)
          |> Stream.reject(fn {_field_name, value} ->
            value == nil
          end)
          |> Enum.into(%{})

        open_search_doc =
          base_document
          |> Map.merge(additional_fields)
          |> Map.merge(additional_fields_2)

        OpenSearchService.put(open_search_doc, publication)
        |> case do
          {:ok, %{status: 201}} ->
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

    OpenSearchService.switch_active_alias(publication)
  end
end
