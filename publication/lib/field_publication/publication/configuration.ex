defmodule FieldPublication.Publication.Configuration do
  @moduledoc """
  This module handles access to a publication's research database.

  You can retrieve the raw documents or an extended version with the publication's configuration
  applied. The latter will group the data fields and add translated labels for the different
  value types, relations etc. (if there are any defined in the configuration). The extended
  version will be returned as a standardized struct, see the
  `FieldPublication.Publications.Data.Document` struct definition below.
  """

  alias FieldPublication.{
    CouchService,
    Publication
  }

  alias FieldPublication.Publication.{
    Category,
    Document,
    DocumentPreview,
    Field,
    FieldGroup,
    RelationGroup
  }

  @report_key "meta_database_creation"

  def report_key(), do: @report_key

  def get(%Publication{configuration_doc: config_name}) do
    Cachex.get(:document_cache, config_name)
    |> case do
      {:ok, nil} ->
        config =
          CouchService.get_document(config_name)
          |> then(fn {:ok, %{body: body}} ->
            Jason.decode!(body)
          end)
          |> Map.get("config", [])

        if config != [] do
          Cachex.put(:document_cache, config_name, config, ttl: 1000 * 60 * 60 * 24 * 7)
        end

        config

      {:ok, cached} ->
        cached
    end
  end

  def get_image_categories(publication) do
    ["Image"] ++ get_child_categories(publication, "Image")
  end

  def get_type_categories(publication) do
    ["Type"] ++ get_child_categories(publication, "Type")
  end

  def get_flat_category_configs(publication) do
    publication
    |> get()
    |> flatten_config()
  end

  defp flatten_config(config) do
    config
    |> Enum.map(&flatten_config_branch/1)
    |> List.flatten()
  end

  defp flatten_config_branch(%{"item" => item, "trees" => trees}) do
    ([item] ++ Enum.map(trees, &flatten_config_branch/1))
    |> List.flatten()
  end

  def get_category_hierarchy(publication) do
    publication
    |> get()
    |> Enum.map(&extract_category_info/1)
    |> Enum.into(%{})
  end

  def extract_category_info(%{
        "item" => %{"name" => name, "color" => color, "label" => labels},
        "trees" => trees
      }) do
    {name,
     %{
       color: color,
       labels: labels,
       children:
         trees
         |> Enum.map(&extract_category_info/1)
         |> Enum.into(%{})
     }}
  end

  def get_child_categories(%Publication{} = publication, category_name) do
    publication
    |> get()
    |> search_category_and_accumulate_children(category_name)
  end

  defp search_category_and_accumulate_children(branch, category_name) do
    branch
    |> Enum.find(fn %{"item" => %{"name" => name}} -> category_name == name end)
    |> case do
      nil ->
        Enum.map(branch, fn %{"trees" => deeper_branch} ->
          search_category_and_accumulate_children(deeper_branch, category_name)
        end)
        |> List.flatten()

      %{"trees" => child_categories} ->
        Enum.map(child_categories, &flatten_category_tree/1)
        |> List.flatten()
    end
  end

  defp flatten_category_tree(%{"item" => %{"name" => name}, "trees" => child_categories}) do
    ([name] ++ Enum.map(child_categories, &flatten_category_tree/1))
    |> List.flatten()
  end

  def get_parent_categories(publication, category_name) do
    publication
    |> get()
    |> search_category_and_accumulate_parents(category_name)
  end

  defp search_category_and_accumulate_parents(branch, category_name, parents \\ []) do
    branch
    |> Enum.find(fn %{"item" => %{"name" => name}} -> name == category_name end)
    |> case do
      nil ->
        Enum.map(branch, fn %{"item" => %{"name" => name}, "trees" => deeper_branch} ->
          search_category_and_accumulate_parents(deeper_branch, category_name, parents ++ [name])
        end)
        |> List.flatten()

      _category_config ->
        parents
    end
  end

  def apply_project_configuration(
        %{"resource" => resource} = _raw_document,
        configuration,
        %Publication{} = publication,
        include_relations \\ false
      ) do
    case search_category_tree(configuration, resource["category"]) do
      {:ok, category_configuration} ->
        image_categories = get_image_categories(publication)

        image_uuids =
          if resource["category"] in image_categories do
            # Add own uuid as shorthand list
            [resource["id"]]
          else
            # Otherwise evaluate the isDepictedIn relations
            resource
            |> Map.get("relations", %{})
            |> Map.get("isDepictedIn", [])
          end

        default_map_layers =
          resource
          |> Map.get("relations", %{})
          |> Map.get("hasDefaultMapLayer", [])

        map_layers =
          resource
          |> Map.get("relations", %{})
          |> Map.get("hasMapLayer", [])

        doc =
          %Document{
            id: resource["id"],
            identifier: resource["identifier"],
            project_identifier: publication.project_identifier,
            publication_draft_date: publication.draft_date,
            category: extend_category(category_configuration["item"], resource),
            groups: extend_field_groups(category_configuration["item"], resource),
            image_uuids: image_uuids,
            default_map_layers: default_map_layers,
            map_layers: map_layers,
            geometry: resource["geometry"]
          }

        short_description =
          doc
          |> Document.get_field_value("shortDescription")
          |> case do
            val when is_binary(val) ->
              # Fallback for older projects.
              %{"unspecifiedLanguage" => val}

            val when is_map(val) ->
              val

            _ ->
              %{}
          end

        doc = %{doc | description: short_description}

        if include_relations do
          child_task_pid =
            Task.async(fn ->
              create_child_relations(resource["id"], publication)
            end)

          other_relations =
            extend_relations(category_configuration["item"], resource, publication)

          child_relations = Task.await(child_task_pid, 1000 * 60)

          all_relations =
            if child_relations.docs != [] do
              other_relations ++ [child_relations]
            else
              other_relations
            end

          {:ok, %Document{doc | relations: all_relations}}
        else
          {:ok, doc}
        end

      {:error, :unknown_category} ->
        {:error, {:unknown_category, resource["category"]}}
    end
  end

  defp extend_category(category_configuration, resource) do
    %Category{
      name: resource["category"],
      labels: category_configuration["label"],
      color: category_configuration["color"]
    }
  end

  defp extend_field_groups(category_configuration, resource) do
    resource_keys = Map.keys(resource)

    category_configuration["groups"]
    |> Stream.map(fn group ->
      group["fields"]
      |> Stream.map(&extend_field(&1, resource_keys, resource))
      |> Enum.reject(fn val -> val == nil end)
      |> case do
        [] ->
          # This group was defined in the configuration, but for the current document there are no
          # values present.
          nil

        fields_with_data ->
          %FieldGroup{name: group["name"], labels: group["label"], fields: fields_with_data}
      end
    end)
    |> Enum.reject(fn group -> group == nil end)
  end

  defp extend_field(field, resource_keys, resource) do
    if(field["name"] in resource_keys) do
      base_fields = %Field{
        name: field["name"],
        value: resource[field["name"]],
        labels: field["label"],
        input_type: field["inputType"]
      }

      if field["valuelist"] do
        value_labels =
          field
          |> Map.get("valuelist", %{})
          |> Map.get("values", %{})
          |> Stream.map(fn {key, map} -> {key, Map.get(map, "label", %{})} end)
          |> Stream.filter(fn {key, _val} ->
            cond do
              is_list(resource[field["name"]]) ->
                if field["inputType"] == "dimension" do
                  key in Enum.map(resource[field["name"]], fn
                    %{"measurementPosition" => position} ->
                      position

                    other ->
                      other
                  end)
                else
                  key in resource[field["name"]]
                end

              is_map(resource[field["name"]]) ->
                key == resource[field["name"]]["value"]

              true ->
                key == resource[field["name"]]
            end
          end)
          |> Enum.into(%{})

        %Field{base_fields | value_labels: value_labels}
      else
        base_fields
      end
    else
      nil
    end
  end

  defp extend_relations(category_configuration, resource, %Publication{} = publication) do
    relations = Map.get(resource, "relations", %{})

    # Load all related documents from CouchDB in one go...
    related_documents =
      relations
      |> Map.values()
      |> List.flatten()
      |> Enum.uniq()
      |> then(fn uuids -> DocumentPreview.list(publication, uuids) end)

    # ...then sort them into their respective relation groups, including the translated labels for those groups.
    relation_types = Map.keys(relations)

    category_configuration["groups"]
    |> Enum.map(fn group ->
      group["fields"]
      |> Stream.map(fn group_field ->
        if group_field["name"] in relation_types do
          %RelationGroup{
            name: group_field["name"],
            labels: group_field["label"],
            docs:
              Enum.filter(related_documents, fn %{id: uuid} ->
                uuid in relations[group_field["name"]]
              end)
          }
        end
      end)
      |> Enum.reject(fn val -> val == nil end)
    end)
    |> List.flatten()
  end

  defp create_child_relations(uuid, %Publication{} = publication) do
    %RelationGroup{
      name: "contains",
      labels:
        FieldPublicationWeb.Translate.supported_languages()
        |> Enum.map(fn locale ->
          {
            locale,
            Gettext.with_locale(
              FieldPublicationWeb.Translate,
              locale,
              fn ->
                Gettext.gettext(
                  FieldPublicationWeb.Translate,
                  "Contains"
                )
              end
            )
          }
        end)
        |> Enum.into(%{}),
      docs:
        uuid
        |> Publication.get_document_hierarchy(publication)
        |> Map.get("children", [])
        |> then(fn uuids -> DocumentPreview.list(publication, uuids) end)
    }
  end

  defp search_category_tree(configuration, category_name) do
    configuration
    |> Stream.map(&search_category_branch(&1, category_name))
    |> Enum.filter(fn val -> val != :not_found end)
    |> List.first(nil)
    |> case do
      nil ->
        {:error, :unknown_category}

      category_config ->
        {:ok, category_config}
    end
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
