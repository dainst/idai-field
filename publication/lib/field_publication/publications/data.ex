defmodule FieldPublication.Publications.Data do
  alias FieldPublication.CouchService
  alias FieldPublication.DocumentSchema.Publication

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
    Cachex.get(:configuration_docs, config_name)
    |> case do
      {:ok, nil} ->
        config =
          CouchService.get_document(config_name)
          |> then(fn {:ok, %{body: body}} ->
            Jason.decode!(body)
          end)
          |> Map.get("config", [])

        Cachex.put(:configuration_docs, config_name, config, ttl: 1000 * 60 * 60 * 24 * 7)

        config

      {:ok, cached} ->
        cached
    end
  end

  def get_hierarchy(%Publication{hierarchy_doc: hierarchy_doc_name}) do
    Cachex.get(:configuration_docs, hierarchy_doc_name)
    |> case do
      {:ok, nil} ->
        hierarchy =
          CouchService.get_document(hierarchy_doc_name)
          |> then(fn {:ok, %{body: body}} ->
            Jason.decode!(body)
          end)
          |> Map.get("hierarchy", [])

        Cachex.put(:configuration_docs, hierarchy_doc_name, hierarchy,
          ttl: 1000 * 60 * 60 * 24 * 7
        )

        hierarchy

      {:ok, cached} ->
        cached
    end
  end

  def document_exists?(uuid, %Publication{database: db}) do
    CouchService.head_document(uuid, db)
    |> case do
      {:ok, %{status: 200}} ->
        true

      _ ->
        false
    end
  end

  def get_document(uuid, %Publication{database: db} = publication, raw \\ false) do
    config = get_configuration(publication)

    raw_data =
      CouchService.get_document(uuid, db)
      |> then(fn {:ok, %{body: body}} ->
        Jason.decode!(body)
      end)

    if raw do
      raw_data
    else
      apply_project_configuration(raw_data, config, publication)
    end
  end

  def get_documents(uuids, %Publication{database: db} = publication, raw \\ false) do
    config = get_configuration(publication)

    raw_data =
      CouchService.get_documents(uuids, db)
      |> then(fn {:ok, %{body: body}} ->
        Jason.decode!(body)
        |> Map.get("results", [])
      end)
      |> Enum.map(fn %{"docs" => docs} ->
        Enum.map(docs, fn doc ->
          case doc do
            %{"ok" => doc} ->
              doc

            other ->
              {:error, other}
          end
        end)
      end)
      |> List.flatten()

    if raw do
      raw_data
    else
      Enum.map(raw_data, &apply_project_configuration(&1, config, publication))
    end
  end

  def get_project_info(%Publication{database: db} = publication) do
    config = get_configuration(publication)

    CouchService.get_document("project", db)
    |> then(fn {:ok, %{body: body}} ->
      Jason.decode!(body)
    end)
    |> apply_project_configuration(config, publication)
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

  def get_doc_stream_for_georeferenced(%Publication{database: database}) do
    query = %{
      selector: %{
        "resource.georeference": %{
          "$ne": nil
        }
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

  def get_project_map_layers(%Publication{database: database}) do
    %{
      selector: %{
        "resource.relations.isMapLayerOf": %{
          "$elemMatch": %{
            "$eq": "project"
          }
        }
      }
    }
    |> run_query(database)
    |> Enum.to_list()
  end

  def apply_project_configuration(%{"resource" => resource}, configuration, publication) do
    category_configuration = search_category_tree(configuration, resource["category"])

    %{
      "id" => resource["id"],
      "identifier" => resource["identifier"],
      "category" => extend_category(category_configuration["item"], resource),
      "groups" => extend_field_groups(category_configuration["item"], resource),
      "relations" => extend_relations(category_configuration["item"], resource, publication)
    }
  end

  def extend_category(category_configuration, resource) do
    %{
      "labels" => category_configuration["label"],
      "color" => category_configuration["color"],
      "values" => resource["category"]
    }
  end

  def extend_field_groups(category_configuration, resource) do
    keys = Map.keys(resource)

    category_configuration["groups"]
    |> Enum.map(fn group ->
      group["fields"]
      |> Enum.map(&extend_field(&1, keys))
      |> Enum.reject(fn val -> val == nil end)
      |> Enum.map(fn %{"key" => key} = map ->
        Map.put(map, "values", resource[key])
      end)
      |> case do
        [] ->
          nil

        fields_with_data ->
          %{"key" => group["name"], "labels" => group["label"], "fields" => fields_with_data}
      end
    end)
    |> Enum.reject(fn group -> is_nil(group) end)
  end

  defp extend_field(field, keys) do
    if(field["name"] in keys) do
      %{"key" => field["name"], "labels" => field["label"], "type" => field["inputType"]}
    else
      nil
    end
  end

  defp extend_relations(category_configuration, resource, %Publication{} = publication) do
    relations = Map.get(resource, "relations", %{})
    keys = Map.keys(relations)

    category_configuration["groups"]
    |> Enum.map(fn group ->
      group["fields"]
      |> Stream.map(&extend_field(&1, keys))
      |> Stream.reject(fn val -> val == nil end)
      |> Enum.map(fn %{"key" => key} = map ->
        Map.put(map, "values", get_doc_previews(publication, relations[key]))
      end)
    end)
    |> List.flatten()
  end

  def get_field_values(doc, name) do
    doc
    |> get_field(name)
    |> case do
      nil ->
        nil

      field ->
        Map.get(field, "values")
    end
  end

  def get_field_labels(doc, name) do
    doc
    |> get_field(name)
    |> case do
      nil ->
        nil

      field ->
        Map.get(field, "labels")
    end
  end

  def get_field(%{"groups" => groups} = _doc, name) when is_list(groups) do
    Enum.map(groups, fn group ->
      Enum.find(group["fields"], fn %{"key" => key} ->
        key == name
      end)
      |> case do
        nil ->
          nil

        field ->
          field
      end
    end)
    |> Enum.reject(fn val -> val == nil end)
    |> List.first()
  end

  # Better solution if doc is used without groups?
  def get_field(_, _) do
    nil
  end

  def get_group(doc, name) do
    doc
    |> Map.get("groups", [])
    |> Enum.find(fn %{"key" => key} -> key == name end)
  end

  def get_relation_by_name(doc, name) do
    Enum.find(doc["relations"], fn relation ->
      relation["key"] == name
    end)
  end

  defp run_query(query, database) do
    CouchService.get_document_stream(query, database)
  end

  def get_doc_previews(%Publication{} = publication, uuid_list) when is_list(uuid_list) do
    config = get_configuration(publication)

    uuid_list
    |> get_documents(publication, true)
    |> Enum.map(fn %{"resource" => res} = _doc ->
      category_configuration = search_category_tree(config, res["category"])

      %{
        "id" => res["id"],
        "identifier" => res["identifier"],
        "category" => extend_category(category_configuration["item"], res),
        "groups" => extend_field_groups(category_configuration["item"], res)
      }
    end)
  end

  defp flatten_category_tree(%{"item" => %{"name" => name}, "trees" => child_categories}) do
    ([name] ++ Enum.map(child_categories, &flatten_category_tree/1))
    |> List.flatten()
  end

  def search_category_tree(configuration, category_name) do
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
