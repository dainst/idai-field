defmodule FieldPublication.Publications.Data do
  @moduledoc """
  This module handles access to a publication's research database.

  You can retrieve the raw documents or an extended version with the publication's configuration
  applied. The latter will group the data fields and add translated labels for the different
  value types, relations etc. (if there are any defined in the configuration). The extended
  version will be returned as a standardized struct, see the
  `FieldPublication.Publications.Data.Document` struct definition below.
  """

  require FieldPublicationWeb.Gettext
  require Logger

  alias FieldPublication.{
    Publications,
    CouchService
  }

  alias FieldPublication.DatabaseSchema.Publication

  defmodule Document do
    @derive Jason.Encoder
    @enforce_keys [:id, :identifier, :category, :project, :publication]
    defstruct [
      :id,
      :identifier,
      :project,
      :publication,
      :category,
      groups: [],
      relations: [],
      image_uuids: [],
      default_map_layers: [],
      map_layers: []
    ]
  end

  defmodule Category do
    @derive Jason.Encoder
    @enforce_keys [:name, :labels, :color]
    defstruct [:name, :labels, :color]
  end

  defmodule FieldGroup do
    @derive Jason.Encoder
    @enforce_keys [:name, :labels]
    defstruct [:name, :labels, fields: []]
  end

  defmodule RelationGroup do
    @derive Jason.Encoder
    @enforce_keys [:name, :labels]
    defstruct [:name, :labels, docs: []]
  end

  defmodule Field do
    @derive Jason.Encoder
    @enforce_keys [:name, :value, :labels, :input_type]
    defstruct [:name, :value, :labels, :value_labels, :input_type]
  end

  def document_map_to_struct(map) do
    %Document{
      id: map["id"],
      identifier: map["identifier"],
      project: map["project"],
      publication: map["publication"],
      category: %Category{
        name: map["category"]["name"],
        labels: map["category"]["labels"],
        color: map["category"]["color"]
      },
      groups:
        map
        |> Map.get("groups", [])
        |> Enum.map(fn group ->
          %FieldGroup{
            name: group["name"],
            labels: group["labels"],
            fields:
              Enum.map(group["fields"], fn field ->
                %Field{
                  name: field["name"],
                  value: field["value"],
                  labels: field["labels"],
                  value_labels: field["value_labels"],
                  input_type: field["input_type"]
                }
              end)
          }
        end),
      relations:
        map
        |> Map.get("relations", [])
        |> Enum.map(fn relation_group ->
          %RelationGroup{
            name: relation_group["name"],
            labels: relation_group["labels"],
            docs: Enum.map(relation_group["docs"], &document_map_to_struct/1)
          }
        end),
      image_uuids: map["image_uuids"]
    }
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

  def get_image_categories(publication) do
    ["Image"] ++ get_child_categories(publication, "Image")
  end

  def get_flat_category_configs(publication) do
    publication
    |> Publications.get_configuration()
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
    |> Publications.get_configuration()
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

  def get_geometries_by_category(%Publication{} = publication) do
    color_mapping =
      publication
      |> get_flat_category_configs()
      |> Enum.map(fn %{"name" => name, "color" => color} ->
        {name, color}
      end)
      |> Enum.into(%{})

    CouchService.get_document_stream(
      %{
        selector: %{},
        fields: [
          "resource.id",
          "resource.category",
          "resource.geometry"
        ]
      },
      publication.database
    )
    |> Stream.filter(fn
      %{"resource" => %{"geometry" => _}} -> true
      _ -> false
    end)
    |> Enum.reduce(%{}, fn %{
                             "resource" => %{
                               "category" => category,
                               "geometry" => geometry
                             }
                           },
                           acc ->
      Map.update(
        acc,
        category,
        %{geometries: [geometry], color: color_mapping[category]},
        fn existing ->
          Map.put(existing, :geometries, existing.geometries ++ [geometry])
        end
      )
    end)
  end

  def get_child_categories(publication, category_name) do
    publication
    |> Publications.get_configuration()
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
    |> Publications.get_configuration()
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

  def get_doc_count(%Publication{database: db}) do
    CouchService.get_database(db)
    |> then(fn {:ok, %{status: 200, body: body}} ->
      body
      |> Jason.decode!()
      |> Map.get("doc_count", 0)
    end)
  end

  def get_raw_document(uuid, %Publication{database: db}) do
    CouchService.get_document(uuid, db)
    |> then(fn {:ok, %{body: body}} ->
      Jason.decode!(body)
    end)
    |> case do
      %{"error" => "not_found"} ->
        {:error, :not_found}

      doc ->
        doc
    end
  end

  def get_raw_documents(uuids, %Publication{database: db}) do
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
            Logger.error(inspect(other))
            {:error, :not_found}
        end
      end)
    end)
    |> List.flatten()
  end

  def get_extended_document(uuid, %Publication{} = publication, include_relations \\ false)
      when is_binary(uuid) do
    config = Publications.get_configuration(publication)

    get_raw_document(uuid, publication)
    |> case do
      {:error, _} ->
        {:error, :not_found}

      doc ->
        apply_project_configuration(doc, config, publication, include_relations)
    end
  end

  def get_extended_documents(
        uuids,
        %Publication{database: db} = publication,
        include_relations \\ false
      ) do
    config = Publications.get_configuration(publication)

    get_raw_documents(uuids, %Publication{database: db})
    |> Enum.map(&apply_project_configuration(&1, config, publication, include_relations))
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

  def get_doc_breakdown_by_category(%Publication{database: database} = publication) do
    configuration =
      Publications.get_configuration(publication)

    %{
      selector: %{},
      fields: [
        "resource.category",
        "resource.geometry"
      ]
    }
    |> run_query(database)
    |> Stream.reject(fn %{
                          "resource" => %{
                            "category" => category_key
                          }
                        } ->
      category_key in ["Project", "Configuration"]
    end)
    |> Enum.reduce(
      %{},
      fn %{
           "resource" =>
             %{
               "category" => category_key
             } = resource
         },
         acc ->
        accumulated_category_data =
          Map.get(
            acc,
            category_key,
            Map.merge(
              %{geometries: []},
              configuration
              |> search_category_tree(category_key)
              |> Map.get("item")
              |> extend_category(resource)
            )
          )

        accumulated_category_data =
          Map.get(resource, "geometry")
          |> case do
            nil ->
              accumulated_category_data

            geometry ->
              Map.put(
                accumulated_category_data,
                :geometries,
                accumulated_category_data.geometries ++ [geometry]
              )
          end

        Map.put(acc, category_key, accumulated_category_data)
      end
    )
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

  def get_field_value(doc, name) do
    doc
    |> get_field(name)
    |> case do
      nil ->
        nil

      %Field{} = field ->
        field.value
    end
  end

  def get_field_labels(doc, name) do
    doc
    |> get_field(name)
    |> case do
      nil ->
        nil

      %Field{} = field ->
        field.labels
    end
  end

  def get_field(%Document{groups: groups} = _doc, name) when is_list(groups) do
    Enum.map(groups, fn %FieldGroup{} = group ->
      Enum.find(group.fields, fn %Field{name: current} ->
        current == name
      end)
      |> case do
        nil ->
          nil

        %Field{} = field ->
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

  def get_relation(%Document{relations: relations} = _doc, name) do
    Enum.find(relations, fn relation ->
      relation.name == name
    end)
  end

  def get_relation(_, _) do
    nil
  end

  def apply_project_configuration(
        %{"resource" => resource} = _document,
        configuration,
        %Publication{} = publication,
        include_relations \\ false
      ) do
    category_configuration = search_category_tree(configuration, resource["category"])

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
        project: publication.project_name,
        publication: publication.draft_date,
        category: extend_category(category_configuration["item"], resource),
        groups: extend_field_groups(category_configuration["item"], resource),
        image_uuids: image_uuids,
        default_map_layers: default_map_layers,
        map_layers: map_layers
      }

    if include_relations do
      child_task_pid =
        Task.async(fn ->
          create_child_relations(resource["id"], publication)
        end)

      other_relations = extend_relations(category_configuration["item"], resource, publication)

      child_relations = Task.await(child_task_pid)

      all_relations =
        if child_relations.docs != [] do
          other_relations ++ [child_relations]
        else
          other_relations
        end

      %Document{doc | relations: all_relations}
    else
      doc
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
    |> Enum.map(fn group ->
      group["fields"]
      |> Enum.map(&extend_field(&1, resource_keys, resource))
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
          |> Enum.map(fn {key, map} -> {key, Map.get(map, "label", %{})} end)
          |> Enum.filter(fn {key, _val} ->
            cond do
              is_list(resource[field["name"]]) ->
                if field["inputType"] == "dimension" do
                  key in Enum.map(resource[field["name"]], fn %{"measurementPosition" => position} ->
                    position
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
      |> get_extended_documents(publication, false)

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
              Enum.filter(related_documents, fn %Document{id: uuid} ->
                uuid in relations[group_field["name"]]
              end)
          }
        end
      end)
      |> Enum.reject(fn val -> val == nil end)
    end)
    |> List.flatten()
  end

  defp create_child_relations(uuid, publication) do
    %RelationGroup{
      name: "contains",
      labels:
        Gettext.known_locales(FieldPublicationWeb.Gettext)
        |> Enum.map(fn locale ->
          {
            locale,
            Gettext.with_locale(
              FieldPublicationWeb.Gettext,
              locale,
              fn ->
                Gettext.gettext(
                  FieldPublicationWeb.Gettext,
                  "Contains"
                )
              end
            )
          }
        end)
        |> Enum.into(%{}),
      docs:
        publication
        |> Publications.get_hierarchy()
        |> Map.get(uuid, %{})
        |> Map.get("children", [])
        |> get_extended_documents(publication)
    }
  end

  defp run_query(query, database) do
    CouchService.get_document_stream(query, database)
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
