defmodule FieldPublication.Publications.Data do
  alias FieldPublication.CouchService
  alias FieldPublication.Schemas.Publication

  def get_all_subcategories(publication, category_name) do
    publication
    |> get_configuration()
    |> Enum.find(fn %{"item" => item} ->
      category_name == item["name"]
    end)
    |> then(fn entry ->
      flatten_category_tree(entry)
    end)
  end

  def get_configuration(%Publication{configuration_doc: config_name}) do
    CouchService.get_document(config_name)
    |> then(fn {:ok, %{body: body}} ->
      Jason.decode!(body)
    end)
    |> Map.get("config", [])
  end

  def get_document(uuid, %Publication{database: db} = publication) do
    config = get_configuration(publication)

    CouchService.get_document(uuid, db)
    |> then(fn {:ok, %{body: body}} ->
      Jason.decode!(body)
    end)
    |> apply_project_configuration(config)
  end

  def get_project_info(%Publication{database: db} = publication) do
    config = get_configuration(publication)

    CouchService.get_document("project", db)
    |> then(fn {:ok, %{body: body}} ->
      Jason.decode!(body)
    end)
    |> apply_project_configuration(config)
  end

  def get_doc_stream_for_categories(%Publication{database: database}, categories)
      when is_list(categories) do
    query =
      %{
        selector: %{
          "$or":
            Enum.map(categories, fn category ->
              %{"resource.category" => category}
            end)
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

  def apply_project_configuration(%{"resource" => resource}, configuration) do
    category_configuration = search_category_tree(configuration, resource["category"])

    %{
      "category" => %{
        "labels" => category_configuration["item"]["categoryLabel"],
        "color" => category_configuration["item"]["color"],
        "values" => resource["category"]
      },
      "groups" => extend_field_groups(category_configuration["item"], resource),
      "relations" => extend_relations(category_configuration["item"], resource)
    }
  end

  defp extend_field_groups(category_configuration, resource) do
    keys = Map.keys(resource)

    category_configuration["groups"]
    |> Enum.map(fn group ->
      extended_fields =
        group["fields"]
        |> Enum.map(&extend_field(&1, keys))
        |> Enum.reject(fn val -> val == nil end)
        |> Enum.map(fn %{"key" => key} = map ->
          Map.put(map, "values", resource[key])
        end)

      %{"key" => group["name"], "labels" => group["label"], "fields" => extended_fields}
    end)
  end

  defp extend_field(field, keys) do
    if(field["name"] in keys) do
      %{"key" => field["name"], "labels" => field["label"], "type" => field["inputType"]}
    else
      nil
    end
  end

  defp extend_relations(category_configuration, resource) do
    relations = Map.get(resource, "relations", %{})
    keys = Map.keys(relations)

    category_configuration["groups"]
    |> Enum.map(fn group ->
      group["fields"]
      |> Enum.map(&extend_field(&1, keys))
      |> Enum.reject(fn val -> val == nil end)
      |> Enum.map(fn %{"key" => key} = map ->
        Map.put(map, "values", relations[key])
      end)
    end)
    |> List.flatten()
  end

  def get_field_values_by_name(doc, searched_key) do
    # Search all fields in all groups for the searched_key, this should probably be optimized further.
    Enum.map(doc["groups"], fn group ->
      Enum.find(group["fields"], fn %{"key" => key} ->
        key == searched_key
      end)
      |> case do
        %{"values" => values} ->
          values

        nil ->
          nil
      end
    end)
    |> Enum.reject(fn val -> val == nil end)
    |> List.first()
  end

  def get_relation_by_name(doc, name) do
    Enum.find(doc["relations"], fn relation ->
      relation["key"] == name
    end)
  end

  defp run_query(query, database) do
    CouchService.get_document_stream(query, database)
  end

  defp flatten_category_tree(%{"item" => %{"name" => name}, "trees" => child_categories}) do
    ([name] ++ Enum.map(child_categories, &flatten_category_tree/1))
    |> List.flatten()
  end

  defp search_category_tree(configuration, category_name) do
    configuration
    |> Stream.map(&search_category_branch(&1, category_name))
    |> Enum.filter(fn val -> val != :not_found end)
    |> List.first(:not_found)
  end

  defp search_category_branch(
         %{"item" => %{"name" => name}, "trees" => child_categories} = category,
         category_name
       ) do
    if name == category_name do
      category
    else
      child_categories
      |> Stream.map(&search_category_branch(&1, category_name))
      |> Enum.filter(fn val -> val != :not_found end)
      |> List.first(:not_found)
    end
  end
end
