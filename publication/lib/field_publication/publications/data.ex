defmodule FieldPublication.Publications.Data do
  alias FieldPublication.Publications
  alias FieldPublication.CouchService
  alias FieldPublication.Schemas.Publication

  @core_document_properties [
    "shortDescription",
    "id",
    "category",
    "identifier",
    "parentId",
    "featureVectors"
  ]

  @reduced_docs_cache Application.compile_env(:field_publication, :reduced_docs_cache_name)

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
      "groups" => group_and_extend_labels(category_configuration["item"], resource)
    }
  end

  defp group_and_extend_labels(category_configuration, resource) do
    keys = Map.keys(resource)

    category_configuration["groups"]
    |> Enum.map(fn group ->
      extended_fields =
        group["fields"]
        |> Enum.map(&extend_fields(&1, keys))
        |> Enum.reject(fn val -> val == nil end)
        |> Enum.map(fn %{"key" => key} = map ->
          Map.put(map, "values", resource[key])
        end)

      %{"key" => group["name"], "labels" => group["label"], "fields" => extended_fields}
    end)
  end

  defp extend_fields(field, keys) do
    if(field["name"] in keys) do
      %{"key" => field["name"], "labels" => field["label"], "type" => field["inputType"]}
    else
      nil
    end
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

  def extend_relations(
        %{"resource" => %{"relations" => relations} = resource} = doc,
        %Publication{} = publication
      ) do
    extended_relations =
      relations
      |> Enum.map(fn {relation_name, uuids} ->
        core_field_docs =
          %{
            selector: %{
              "$or":
                Enum.map(uuids, fn uuid ->
                  %{"_id" => uuid}
                end)
            }
          }
          |> run_query(publication.database)
          |> Enum.map(fn relation_doc ->
            reduce_to_core_fields(relation_doc, publication)
          end)

        %{relation_name => core_field_docs}
      end)

    updated_resource = Map.put(resource, "relations", extended_relations)
    Map.put(doc, "resource", updated_resource)
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

  defp reduce_to_core_fields(%{"resource" => resource, "_id" => id}, %Publication{} = publication) do
    key = "#{Publications.get_doc_id(publication)}-#{id}"

    {_, result} =
      Cachex.fetch(@reduced_docs_cache, key, fn _key ->
        minimal_resource =
          @core_document_properties
          |> Enum.map(fn key ->
            {key, Map.get(resource, key)}
          end)
          |> Enum.reject(fn {_key, value} -> value == nil end)
          |> Enum.into(%{})

        {:commit, %{"resource" => minimal_resource}}
      end)

    result
  end
end
