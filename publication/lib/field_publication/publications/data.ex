defmodule FieldPublication.Publications.Data do
  @moduledoc """
  This module handles access to a publication's research database.

  You can retrieve the raw documents or an extended version with the publication's configuration
  applied. The latter will group the data fields and add translated labels for the different
  value types, relations etc. (if there are any defined in the configuration). The extended
  version will be returned as a standardized struct, see the
  `FieldPublication.Publications.Data.Document` struct definition below.
  """

  require FieldPublicationWeb.Translate
  require Logger

  alias FieldPublication.{
    CouchService,
    Publications,
    Publications.Data.Document
  }

  alias FieldPublication.DatabaseSchema.{
    DataHierarchy,
    DataIssues,
    DataPreview,
    LogEntry,
    Publication
  }

  @document_cache_name :document_cache

  defmodule Document do
    @derive Jason.Encoder
    @enforce_keys [:id, :identifier, :category, :project_key, :publication_draft_date]
    defstruct [
      :id,
      :identifier,
      :project_key,
      :publication_draft_date,
      :category,
      :geometry,
      description: %{},
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
      project_key: map["project_key"],
      publication_draft_date: map["publication_draft_date"],
      description: map["description"],
      category: %Category{
        name: map["category"]["name"],
        labels: map["category"]["labels"],
        color: map["category"]["color"]
      },
      geometry: map["geometry"],
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

  def report_data_issue(uuid, %LogEntry{} = entry, %Publication{} = publication)
      when is_binary(uuid) do
    meta_db_name = get_meta_database_name(publication)
    DataIssues.add_entry(uuid, entry, meta_db_name)
  end

  def report_data_issues(issues, %Publication{} = publication) when is_list(issues) do
    meta_db_name = get_meta_database_name(publication)
    DataIssues.add_entries(issues, meta_db_name)
  end

  def clear_data_issues(publication, report_key) do
    meta_db_name = get_meta_database_name(publication)

    DataIssues.remove_entries(report_key, meta_db_name)
  end

  def recreate_meta_database(%Publication{database: db} = publication) do
    report_key = "meta_database_creation"

    {_, meta_db_name} = create_meta_database(publication)

    CouchService.get_document_stream(
      %{
        selector: %{
          "$or": [
            %{doc_type: "hierarchy"},
            %{doc_type: "preview"},
            %{entries: %{"$elemMatch": %{reported_by: report_key}}}
          ]
        }
      },
      meta_db_name
    )
    |> Stream.map(fn doc ->
      %{
        "_id" => doc["_id"],
        "_rev" => doc["_rev"],
        "_deleted" => true
      }
    end)
    |> Stream.chunk_every(10000)
    |> Enum.each(fn doc_list ->
      CouchService.post_documents(doc_list, meta_db_name)
    end)

    hierarchy_mapping = generate_hierarchy_mapping(publication)

    hierarchy_documents =
      hierarchy_mapping
      |> Enum.map(fn {uuid, %{parent: parent_uuid, children: children}} ->
        DataHierarchy.create(uuid, parent_uuid, children)
      end)
      |> Enum.filter(fn
        {:ok, _doc} ->
          true

        {:error, changeset} ->
          report_data_issue(
            Ecto.Changeset.get_field(changeset, :uuid),
            LogEntry.create(%{
              type: "invalid_document",
              reported_by: report_key,
              severity: :error,
              message: inspect(changeset)
            }),
            publication
          )

          Logger.error("Failed to create hierarchy document:")
          Logger.error(inspect(changeset))
          false
      end)
      |> Enum.map(fn {:ok, doc} -> doc end)

    Stream.chunk_every(hierarchy_documents, 2000)
    |> Enum.each(fn batch ->
      CouchService.post_documents(batch, meta_db_name)
    end)

    config = Publications.get_configuration(publication)
    pub_id = Publications.get_doc_id(publication)

    CouchService.get_document_stream(%{selector: %{}}, db)
    |> Stream.reject(fn
      %{"resource" => %{"category" => "Configuration"}} ->
        true

      %{"resource" => _} ->
        false

      other ->
        report_data_issue(
          other["_id"],
          LogEntry.create(%{
            type: "invalid_document",
            reported_by: report_key,
            severity: :error,
            message: "Invalid document for preview creation."
          }),
          publication
        )

        true
    end)
    |> Stream.map(fn raw_doc ->
      {raw_doc, apply_project_configuration(raw_doc, config, publication)}
    end)
    |> Stream.filter(fn
      {_raw_doc, %Document{} = _full} ->
        true

      {raw_doc, error} ->
        Logger.warning(
          "Failed to apply project configuration to `#{raw_doc["_id"]}` (`#{pub_id}`)"
        )

        Logger.warning(inspect(error))

        report_data_issue(
          raw_doc["_id"],
          LogEntry.create(%{
            type: "invalid_document",
            reported_by: report_key,
            severity: :error,
            message: inspect(error)
          }),
          publication
        )

        false
    end)
    |> Stream.map(fn {_raw_doc, %Document{} = doc} ->
      # Remove groups and relations from doc
      DataPreview.create(doc)
    end)
    |> Stream.filter(fn
      {:ok, _doc} ->
        true

      {:error, changeset} ->
        Logger.error("Failed to create preview document:")
        Logger.error(inspect(changeset))
        false
    end)
    |> Stream.map(fn {:ok, doc} -> doc end)
    |> Stream.chunk_every(2000)
    |> Enum.map(fn payload ->
      CouchService.post_documents(payload, meta_db_name)
    end)
  end

  def get_issues(%Publication{} = publication) do
    publication
    |> get_meta_database_name()
    |> DataIssues.list()
  end

  def get_grouped_issues(%Publication{} = publication) do
    publication
    |> get_issues()
    |> Enum.reduce(%{}, fn %DataIssues{uuid: uuid, entries: entries} = _doc, acc ->
      Enum.reduce(entries, acc, fn %LogEntry{
                                     message: message,
                                     severity: severity,
                                     type: type,
                                     reported_by: reported_by
                                   },
                                   inner_acc ->
        Map.update(
          inner_acc,
          {type, severity},
          [%{uuid: uuid, message: message, reported_by: reported_by}],
          fn existing ->
            existing ++ [%{uuid: uuid, message: message, reported_by: reported_by}]
          end
        )
      end)
    end)
  end

  defp generate_hierarchy_mapping(%Publication{} = publication) do
    pub_id = Publications.get_doc_id(publication)

    publication
    |> get_doc_stream_for_all()
    |> Enum.reduce(%{}, fn doc, acc ->
      uuid = doc["_id"]

      {_key, [parent_uuid]} =
        Enum.find(doc["resource"]["relations"], nil, fn {key, _val} ->
          key == "liesWithin"
        end)
        |> case do
          nil ->
            Enum.find(doc["resource"]["relations"], {nil, [nil]}, fn {key, _val} ->
              key == "isRecordedIn"
            end)

          {"liesWithin", [_single_relation_uuid]} = val ->
            val

          _other_val ->
            # Temporary (fingers crossed) hack for meninx
            Logger.error(
              "Encountered invalid 'liesWithin' relation for document '#{uuid}'. Falling back to 'isRecordedIn' in hierarchy document. (`#{pub_id}`)"
            )

            Enum.find(doc["resource"]["relations"], {nil, [nil]}, fn {key, _val} ->
              key == "isRecordedIn"
            end)
        end

      # Update or initialize self
      acc =
        Map.update(acc, doc["_id"], %{children: [], parent: parent_uuid}, fn existing ->
          Map.put(existing, :parent, parent_uuid)
        end)

      # Update or initialize the parent
      if parent_uuid != nil do
        Map.update(
          acc,
          parent_uuid,
          %{children: [uuid], parent: nil},
          fn %{
               children: existing_children
             } = existing ->
            Map.put(existing, :children, existing_children ++ [uuid])
          end
        )
      else
        acc
      end
    end)
    |> Enum.into(%{})
  end

  def create_meta_database(%Publication{} = publication) do
    index_documents =
      [
        %{
          index: %{fields: ["doc_type"]},
          ddoc: "doc_type-index",
          name: "doc_type-index",
          type: "json"
        },
        %{
          index: %{fields: ["uuid"]},
          ddoc: "uuid-index",
          name: "uuid-index",
          type: "json"
        },
        %{
          index: %{
            fields: [
              "uuid",
              "doc_type"
            ]
          },
          ddoc: "uuid-doc_type-index",
          name: "uuid-doc_type-index",
          type: "json"
        },
        %{
          index: %{fields: ["parent_uuid"]},
          ddoc: "parent-uuid-index",
          name: "parent-uuid-index",
          type: "json"
        },
        %{
          index: %{fields: ["children_uuids"]},
          ddoc: "children-uuid-index",
          name: "children-uuid-index",
          type: "json"
        },
        %{
          index: %{fields: ["entries.reported_by"]},
          ddoc: "issue-reported-by-index",
          name: "issue-reported-by-index",
          type: "json"
        },
        %{
          index: %{fields: ["entries.severity"]},
          ddoc: "issue-severity-index",
          name: "issue-severity-index",
          type: "json"
        },
        %{
          index: %{fields: ["entries.type"]},
          ddoc: "issue-type-index",
          name: "issue-type-index",
          type: "json"
        },
        %{
          index: %{
            partial_filter_selector: [
              %{
                "preview.geometry": %{
                  "$ne": nil
                }
              }
            ],
            fields: ["preview.geometry"],
            ddoc: "previews-with-geometry-index",
            name: "previews-with-geometry-index",
            type: "json"
          }
        }
      ]

    name = get_meta_database_name(publication)

    CouchService.put_database(name)
    |> case do
      {:ok, %{status: status}} when status in [201, 202] ->
        Enum.each(index_documents, &CouchService.put_index_document(&1, name))

        {:ok, name}

      {:ok, %{status: 400}} ->
        {:error, :invalid_name}

      {:ok, %{status: 401}} ->
        {:error, :not_authorized}

      {:ok, %{status: 403}} ->
        {:error, :forbidden}

      {:ok, %{status: 412}} ->
        Enum.each(index_documents, &CouchService.put_index_document(&1, name))
        {:already_exists, name}
    end
  end

  def delete_meta_database(%Publication{} = publication) do
    name = get_meta_database_name(publication)

    name
    |> CouchService.delete_database()
    |> case do
      {:ok, %{status: status}} when status in [200, 202, 404] ->
        {:ok, name}

      {:ok, %{status: 400}} ->
        {:error, :invalid_name}

      {:ok, %{status: 401}} ->
        {:error, :not_authorized}

      {:ok, %{status: 403}} ->
        {:error, :forbidden}
    end
  end

  defp get_meta_database_name(%Publication{} = publication) do
    "meta_#{Publications.get_doc_id(publication)}"
  end

  def recreate_database_indices(%Publication{database: database} = publication) do
    %{relations: relations} =
      get_doc_stream_for_all(publication)
      |> Enum.reduce(%{relations: []}, fn
        %{"resource" => %{"relations" => relations_map}}, acc ->
          doc_relations =
            Map.keys(relations_map)
            |> Enum.map(fn relation ->
              "resource.relations.#{relation}"
            end)

          Map.put(acc, :relations, Enum.uniq(doc_relations ++ acc[:relations]))

        _, acc ->
          acc
      end)

    [
      %{index: %{fields: relations}, name: "document-relations-index", type: "json"},
      %{index: %{fields: ["resource.category"]}, name: "document-category-index", type: "json"}
    ]
    |> Enum.map(&CouchService.put_index_document(&1, database))
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

  def list_with_geometries(%Publication{} = publication) do
    db_name = get_meta_database_name(publication)

    CouchService.get_document_stream(
      %{
        selector: %{"preview.geometry": %{"$ne": nil}},
        use_index: "previews-with-geometry-index"
      },
      db_name
    )
    |> Stream.map(fn %{"preview" => preview} ->
      preview
    end)
    |> Stream.map(&document_map_to_struct/1)
  end

  def get_project_geometry_feature_collections(
        %Publication{project_name: project_key, draft_date: draft_date} = publication
      ) do
    cache_doc_name = "geometry_feature_collections_#{project_key}_#{draft_date}"

    Cachex.get(:application_documents, cache_doc_name)
    |> case do
      {:ok, hit} when hit != nil ->
        hit

      _ ->
        hierarchy = get_document_hierarchy(publication)

        {category_labels, feature_collections} =
          list_with_geometries(publication)
          |> Enum.map(
            &create_map_feature(
              &1,
              hierarchy,
              publication
            )
          )
          |> Enum.reduce({%{}, %{}}, fn {:ok, {category_labels, feature}},
                                        {labels, collections} ->
            category = feature.properties.category

            updated_labels =
              case Map.get(labels, category) do
                nil -> Map.put(labels, category, category_labels)
                _existing -> labels
              end

            updated_collections =
              case Map.get(collections, category) do
                nil ->
                  # Create a new feature collection for this category with the first feature
                  # as its first member.
                  Map.put(collections, category, %{
                    type: "FeatureCollection",
                    properties: %{
                      group: category
                    },
                    features: [feature]
                  })

                existing_collection ->
                  # Otherwise add the feature to the existing collection.
                  updated_collection =
                    Map.update!(existing_collection, :features, fn existing_features ->
                      existing_features ++ [feature]
                    end)

                  Map.put(collections, category, updated_collection)
              end

            {updated_labels, updated_collections}
          end)

        result =
          %{
            category_labels: category_labels,
            feature_collections: feature_collections
          }

        Cachex.put(:application_documents, cache_doc_name, result)

        result
    end
  end

  def get_map_feature_collection(documents, %Publication{} = publication)
      when is_list(documents) do
    hierarchy = get_document_hierarchy(publication)

    {label_info, features} =
      documents
      |> Stream.map(fn %Document{} = document ->
        create_map_feature(document, hierarchy, publication)
      end)
      |> Stream.reject(fn
        {:error, _} -> true
        _ -> false
      end)
      |> Enum.reduce(
        {%{}, []},
        fn {
             :ok,
             {category_labels, %{properties: %{category: category}} = feature}
           },
           {existing_labels_map, existing_feature_list} ->
          updated_labels = Map.put_new(existing_labels_map, category, category_labels)
          updated_features = existing_feature_list ++ [feature]

          {updated_labels, updated_features}
        end
      )

    %{
      type: "FeatureCollection",
      properties: %{
        category_labels: label_info
      },
      features: features
    }
  end

  def create_map_feature(
        %Document{
          geometry: nil
        },
        _hierarchy,
        _publication
      ) do
    {:error, :no_geometry}
  end

  def create_map_feature(
        %Document{
          category: %Category{color: color, labels: category_labels, name: category_key},
          id: uuid,
          description: description,
          identifier: identifier,
          geometry: geometry
        },
        hierarchy,
        publication
      ) do
    description =
      case description do
        nil ->
          %{}

        value when is_binary(value) ->
          # Using the same key as Field Desktop, that is why it is no written with underscore.
          %{unspecifiedLanguage: value}

        values when is_map(values) ->
          values
      end

    {
      :ok,
      {
        category_labels,
        %{
          type: "Feature",
          geometry: geometry,
          properties: %{
            type: geometry["type"],
            uuid: uuid,
            identifier: identifier,
            color: color,
            description: description,
            category: category_key,
            parent: uuid_of_next_ancestor_with_geometry(uuid, hierarchy, publication)
          }
        }
      }
    }
  end

  def next_ancestor_with_geometry(uuid, hierarchy, publication) do
    Map.get(hierarchy, uuid)
    |> case do
      %{"parent" => nil} ->
        nil

      %{"parent" => parent_uuid} ->
        get_preview_documents([parent_uuid], publication)

      nil ->
        nil
    end
    |> case do
      [%Document{id: parent_uuid, geometry: nil}] ->
        next_ancestor_with_geometry(parent_uuid, hierarchy, publication)

      [%Document{} = parent_with_geometry] ->
        parent_with_geometry

      _ ->
        nil
    end
  end

  def uuid_of_next_ancestor_with_geometry(uuid, hierarchy, publication) do
    next_ancestor_with_geometry(uuid, hierarchy, publication)
    |> case do
      %Document{id: uuid} ->
        uuid

      _ ->
        nil
    end
  end

  def get_geometries_by_category(%Publication{} = publication) do
    color_mapping =
      publication
      |> get_flat_category_configs()
      |> Enum.map(fn %{"name" => name, "color" => color} ->
        {name, color}
      end)
      |> Enum.into(%{})

    meta_db = get_meta_database_name(publication)

    CouchService.get_document_stream(
      %{
        selector: %{"preview.geometry": %{"$ne": nil}},
        use_index: "previews-with-geometry-index"
      },
      meta_db
    )
    |> Stream.map(fn %{"preview" => preview} ->
      preview
    end)
    |> Stream.map(&document_map_to_struct/1)
    |> Enum.reduce(%{}, fn %Document{category: %{name: category}, geometry: geometry}, acc ->
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
        %Publication{} = publication,
        include_relations \\ false
      ) do
    config = Publications.get_configuration(publication)

    uuids
    |> get_raw_documents(publication)
    |> Enum.map(&apply_project_configuration(&1, config, publication, include_relations))
  end

  def get_document_hierarchy(%Publication{} = publication) do
    cache_database = get_meta_database_name(publication)
    hierarchy_cache = "hierarchy_#{Publications.get_doc_id(publication)}"

    Cachex.get(@document_cache_name, hierarchy_cache)
    |> case do
      {:ok, nil} ->
        Logger.debug("No document cache for hierarchy.")

        hierarchy = DataHierarchy.list(cache_database)
        Cachex.put(@document_cache_name, hierarchy_cache, hierarchy, ttl: 1000 * 60 * 60 * 24 * 7)

        hierarchy

      {:ok, cached} ->
        cached
    end
  end

  def get_document_hierarchy(uuid, %Publication{} = publication) when is_binary(uuid) do
    get_document_hierarchy(publication)
    |> Map.get(uuid)
  end

  def get_document_hierarchy(uuids, %Publication{} = publication) when is_list(uuids) do
    get_document_hierarchy(publication)
    |> Map.take(uuids)
  end

  def get_preview_documents(%Publication{} = publication) do
    cache_database = get_meta_database_name(publication)
    DataPreview.list(cache_database)
  end

  def get_preview_documents(
        uuids,
        %Publication{} = publication
      ) do
    cache_database = get_meta_database_name(publication)
    DataPreview.list(cache_database, uuids)
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
            project_key: publication.project_name,
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
          |> get_field_value("shortDescription")
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

          %Document{doc | relations: all_relations}
        else
          doc
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
      |> get_preview_documents(publication)

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

  defp create_child_relations(uuid, publication) do
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
        get_document_hierarchy(uuid, publication)
        |> Map.get("children")
        |> get_preview_documents(publication)
    }
  end

  defp run_query(query, database) do
    CouchService.get_document_stream(query, database)
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
