defmodule FieldPublication.PublicationsData do
  alias FieldPublication.CouchService
  alias FieldPublication.Schemas.Publication

  def get_all_subcategories(%Publication{configuration_doc: config_name}, category) do
    CouchService.get_document(config_name)
    |> then(fn {:ok, %{body: body}} ->
      Jason.decode!(body)
    end)
    |> Map.get("config", [])
    |> Enum.find(fn %{"item" => item} ->
      category == item["name"]
    end)
    |> then(fn entry ->
      flatten_category_tree(entry)
    end)
  end

  defp flatten_category_tree(%{"item" => %{"name" => name}, "trees" => child_category_items}) do
    ([name] ++ Enum.map(child_category_items, &flatten_category_tree/1))
    |> List.flatten()
  end

  def get_doc_stream_for_categories(%Publication{database: database}, categories)
      when is_list(categories) do
    query =
      %{
        selector: %{
          "$or":
            Enum.map(categories, fn category ->
              [
                %{"resource.category" => category},
                %{"resource.type" => category}
              ]
            end)
            |> List.flatten()
        }
      }

    run_query(query, database)
  end

  def get_doc_stream_for_all(%Publication{database: database}) do
    run_query(
      %{
        selector: %{}
      },
      database
    )
  end

  defp run_query(query, database) do
    CouchService.get_document_stream(query, database)
    |> Stream.map(&replace_resource_type_with_category/1)
  end

  defp replace_resource_type_with_category(doc) do
    # Replace 'resource.type' with 'resource.category'. 'type' will become
    # deprecated. TODO: Remove this once 'type' is not used anymore.
    case Map.get(doc, "resource") do
      nil ->
        doc

      _resource ->
        Map.update!(doc, "resource", fn resource ->
          case Map.get(resource, "type") do
            nil ->
              resource

            type_value ->
              resource
              |> Map.put_new("category", type_value)
              |> Map.delete("type")
          end
        end)
    end
  end
end
