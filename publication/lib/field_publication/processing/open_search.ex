defmodule FieldPublication.Processing.OpenSearch do
  alias FieldPublication.DataServices.OpensearchService
  alias FieldPublication.Publications
  alias FieldPublication.Schemas.Publication

  def index(%Publication{} = publication) do
    publication_id = Publications.get_doc_id(publication)
    configuration = Publications.Data.get_configuration(publication)

    OpensearchService.initialize_indices_for_alias(publication_id)
    OpensearchService.clear_inactive_index(publication_id)

    publication
    |> Publications.Data.get_doc_stream_for_all()
    |> Stream.reject(fn %{"resource" => %{"category" => category}} ->
      category in ["Project", "Configuration"]
    end)
    |> Stream.reject(fn doc ->
      # Reject all documents marked as deleted
      Map.get(doc, "deleted", false)
    end)
    |> Stream.map(fn doc ->
      doc
      |> Map.put("id", doc["_id"])
      |> Map.delete("_id")
      |> Map.delete("_attachments")
    end)
    |> Stream.map(&Publications.Data.apply_project_configuration(&1, configuration))
    |> Stream.map(&Publications.Data.extend_relations(&1, publication))
    |> Task.async_stream(
      fn doc ->
        OpensearchService.put(publication_id, doc)
      end,
      timeout: 1000 * 30
    )
    |> Enum.to_list()

    OpensearchService.switch_active_index(publication_id)
  end
end
