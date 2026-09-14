defmodule FieldPublication.Publication do
  use Ecto.Schema

  import Ecto.Changeset

  alias Phoenix.PubSub

  alias FieldPublication.{
    CouchService,
    FileService,
    Project
  }

  alias FieldPublication.Publication.{
    Configuration,
    Search
  }

  alias FieldPublication.DatabaseSchema.{
    Translation,
    LogEntry
  }

  alias FieldPublication.DatabaseSchema.{
    ReplicationInput
  }

  require Logger
  @document_cache_name :document_cache

  @report_key "publication"
  def report_key(), do: @report_key

  @doc_type "publication"
  @primary_key false
  embedded_schema do
    field(:_id, :string)
    field(:_rev, :string)
    field(:doc_type, :string, default: @doc_type)
    field(:project_identifier, :string, primary_key: true)
    field(:source_url, :string)
    field(:source_project_identifier, :string)
    field(:draft_date, :date, primary_key: true)
    field(:drafted_by, :string)
    field(:replication_finished, :utc_datetime)
    field(:publication_date, :date)
    field(:configuration_doc, :string)
    field(:database, :string)
    field(:meta_database, :string)
    field(:languages, {:array, :string}, default: [])
    field(:contact, :string)
    field(:epsg_code, :integer)
    # Version is currently not used, the default is saved. The idea is to maybe
    # allow revision releases that can be created to fix errors without adding
    # a new major version. These then could get communicated differently through
    # the web UI.
    field(:version, Ecto.Enum, values: [:major, :revision], default: :major)
    embeds_many(:comments, Translation, on_replace: :delete)
    embeds_many(:replication_logs, LogEntry, on_replace: :delete)
  end

  def changeset(%__MODULE__{} = publication, attrs \\ %{}) do
    publication
    |> cast(attrs, [
      :_rev,
      :project_identifier,
      :source_url,
      :source_project_identifier,
      :drafted_by,
      :draft_date,
      :replication_finished,
      :publication_date,
      :configuration_doc,
      :database,
      :languages,
      :version,
      :contact,
      :epsg_code
    ])
    |> cast_embed(:comments,
      sort_param: :comments_sort,
      drop_param: :comments_drop
    )
    |> cast_embed(:replication_logs)
    |> Translation.language_unique_constraint(:comments)
    |> validate_required([
      :project_identifier,
      :source_url,
      :source_project_identifier,
      :draft_date,
      :configuration_doc,
      :database,
      :version
    ])
    |> ensure_project_exists()
    |> set_id()
    |> set_metadatabase_name()
  end

  def doc_type() do
    @doc_type
  end

  def set_metadatabase_name(changeset) do
    id = get_field(changeset, :_id)

    db_name ="meta%2F#{id}"
    CouchService.put_database(db_name)
    |> case do
      {:ok, %{status: status}} when status in [201, 202, 412] ->
        put_change(changeset, :meta_database, db_name)
      error ->
        Logger.error(inspect(error))
        add_error(changeset, :meta_database, "Unable to create metadatabase for #{id}.")
    end
  end

  def id(project_identifier, draft_date) do
    Enum.join([@doc_type, project_identifier, draft_date], "_")
  end

  defp ensure_project_exists(changeset) do
    project_identifier = get_field(changeset, :project_identifier)

    Project.get(project_identifier)
    |> case do
      {:ok, _project} ->
        changeset

      {:error, :not_found} ->
        add_error(
          changeset,
          :project_identifier,
          "Project #{project_identifier} document not found."
        )
    end
  end

  def set_id(changeset) do
    with project_identifier <- get_field(changeset, :project_identifier),
         %Date{} = draft_date <- get_field(changeset, :draft_date) do
      put_change(changeset, :_id, id(project_identifier, draft_date))
    else
      _something_else_already_invalid ->
        changeset
    end
  end

  def create_meta_database(%__MODULE__{meta_database: meta_db}) do
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

    CouchService.put_database(meta_db)
    |> case do
      {:ok, %{status: status}} when status in [201, 202] ->
        Enum.each(index_documents, &CouchService.put_index_document(&1, meta_db))

        {:ok, meta_db}

      {:ok, %{status: 400}} ->
        {:error, :invalid_name}

      {:ok, %{status: 401}} ->
        {:error, :not_authorized}

      {:ok, %{status: 403}} ->
        {:error, :forbidden}

      {:ok, %{status: 412}} ->
        Enum.each(index_documents, &CouchService.put_index_document(&1, meta_db))
        {:already_exists, meta_db}
    end
  end

  def delete_meta_database(%__MODULE__{meta_database: meta_db}) do
    meta_db
    |> CouchService.delete_database()
    |> case do
      {:ok, %{status: status}} when status in [200, 202, 404] ->
        {:ok, meta_db}

      {:ok, %{status: 400}} ->
        {:error, :invalid_name}

      {:ok, %{status: 401}} ->
        {:error, :not_authorized}

      {:ok, %{status: 403}} ->
        {:error, :forbidden}
    end
  end

  @moduledoc """
  This module contains functions to retrieve, create, update and list publications within the
  FieldPublication system.

  This primarily concerns the publication metadata that resides in the application's core
  database. If you want to access the publications' actual research data use the respective modules,
  see `FieldPublication.Publications.Data` and `FieldPublication.Publications.Search`.
  """

  @doc """
  Initializes a new publication based on some user input.
  """
  def create_from_replication_input(%ReplicationInput{
        source_url: source_url,
        source_project_identifier: source_project_identifier,
        project_identifier: project_identifier,
        delete_existing_publication: delete_existing,
        drafted_by: drafted_by,
        draft_date: draft_date
      }) do
    changeset =
      %__MODULE__{}
      |> changeset(%{
        project_identifier: project_identifier,
        source_url: source_url,
        source_project_identifier: source_project_identifier,
        configuration_doc: "configuration_#{project_identifier}_#{draft_date}",
        database: "publication_#{project_identifier}_#{draft_date}",
        draft_date: draft_date,
        drafted_by: drafted_by
      })

    case apply_action(changeset, :create) do
      {:ok, publication} ->
        if delete_existing do
          get(project_identifier, draft_date)
          |> case do
            {:ok, existing} ->
              # TODO: if the existing publication is already published, do not allow deletion?
              # this is a rare edge case when somebody would draft and publish at the same date.
              delete(existing)
              :ok

            _ ->
              :ok
          end
        end

        put(publication)

      {:error, _changeset} = error ->
        error
    end
  end

  def get(project_identifier, draft_date)
      when is_binary(draft_date) and is_binary(project_identifier) do
    case Date.from_iso8601(draft_date) do
      {:ok, %Date{} = parsed} ->
        get(project_identifier, parsed)

      _ ->
        {:error, :invalid_date}
    end
  end

  def get(project_identifier, %Date{} = draft_date) when is_binary(project_identifier) do
    project_identifier
    |> id(draft_date)
    |> get()
  end

  def get!(project_identifier, draft_date) do
    {:ok, publication} = get(project_identifier, draft_date)
    publication
  end

  def get(doc_id) do
    Cachex.get(:document_cache, doc_id)
    |> case do
      {:ok, nil} ->
        doc_id
        |> CouchService.get_document()
        |> case do
          {:ok, %{status: 200, body: body}} ->
            json_doc = Jason.decode!(body)

            publication =
              apply_changes(changeset(%__MODULE__{}, json_doc))

            Cachex.put(:document_cache, doc_id, publication, ttl: 1000 * 60 * 60 * 24 * 7)

            {:ok, publication}

          {:ok, %{status: 404}} ->
            {:error, :not_found}
        end

      {:ok, cached} ->
        {:ok, cached}
    end
  end

  def get!(doc_id) do
    {:ok, publication} = get(doc_id)
    publication
  end

  def get_published(project_identifier) do
    list(project_identifier)
    |> Stream.reject(fn %__MODULE__{} = pub -> pub.publication_date == nil end)
    |> Enum.sort(fn %__MODULE__{publication_date: a}, %__MODULE__{publication_date: b} ->
      Date.compare(a, b) in [:eq, :gt]
    end)
  end

  def get_current_published() do
    list()
    |> Enum.group_by(fn val -> val.project_identifier end)
    |> Stream.map(fn {_project_identifier, publications} ->
      publications
      |> Stream.reject(fn %__MODULE__{} = pub -> pub.publication_date == nil end)
      |> Enum.sort(fn %__MODULE__{publication_date: a}, %__MODULE__{publication_date: b} ->
        Date.compare(a, b) in [:eq, :gt]
      end)
      |> List.first(:none)
    end)
    |> Enum.reject(fn val -> val == :none end)
  end

  def get_current_published(project_identifier) do
    project_identifier
    |> get_published()
    |> List.first(:none)
  end

  @doc """
  Returns the most recent publication(s) based on user's access rights and
  the draft date.
  """
  def get_most_recent(project_identifier \\ :all, user_name \\ nil)

  def get_most_recent(:all, user_name) do
    list()
    |> Enum.group_by(fn val -> val.project_identifier end)
    |> Stream.map(fn {_project_identifier, publications} ->
      publications
      |> Stream.reject(fn publication -> publication.replication_finished == nil end)
      |> Stream.filter(fn %__MODULE__{} = pub ->
        Project.has_publication_access?(pub, user_name)
      end)
      |> Enum.sort(fn %__MODULE__{draft_date: a}, %__MODULE__{draft_date: b} ->
        Date.compare(a, b) in [:eq, :gt]
      end)
      |> List.first()
    end)
    |> Enum.reject(fn val -> val == nil end)
  end

  def get_most_recent(project_identifier, user_name) do
    list(project_identifier)
    |> Stream.reject(fn publication -> publication.replication_finished == nil end)
    |> Stream.filter(fn publication ->
      Project.has_publication_access?(publication, user_name)
    end)
    |> Enum.sort(fn %__MODULE__{draft_date: a}, %__MODULE__{draft_date: b} ->
      Date.compare(a, b) in [:eq, :gt]
    end)
    |> List.first()
  end

  def list() do
    run_search(%{selector: %{doc_type: @doc_type}})
  end

  def list(project_identifier) when is_binary(project_identifier) do
    run_search(%{
      selector: %{doc_type: @doc_type, project_identifier: project_identifier}
    })
  end

  defp run_search(query) do
    CouchService.get_document_stream(query)
    |> Enum.map(fn doc ->
      changeset(%__MODULE__{}, doc)
      |> apply_changes()
    end)
  end

  @doc """
  Creates a new publication or updates an existing one.

  __Parameters__
  - `publication`, a Publication schema struct
  - `params`, a map containing updated values that have not been evaluated yet.

  If `publication` has a valid _rev only the publication document gets updated (used for setting updating the publication date, comments etc. after creation).
  Without a _rev it is assumed this is a new publication and the application will first try to create a corresponding database.
  """
  def put(publication, params \\ %{})

  def put(%__MODULE__{_id: doc_id, _rev: rev} = publication, params) when not is_nil(rev) do
    # If revision is not nil, this is an update to an existing publication. No need to to create documents, initializes search indices etc.
    changeset = changeset(publication, params)

    Cachex.del(:document_cache, doc_id)

    with {:ok, publication} <- apply_action(changeset, :create),
         {:ok, %{status: 201}} <- CouchService.put_document(doc_id, publication) do
      {:ok, %__MODULE__{} = updated_publication} =
        CouchService.get_document(doc_id)
        |> then(fn {:ok, %{status: 200, body: body}} ->
          %__MODULE__{}
          |> changeset(Jason.decode!(body))
          |> apply_action(:create)
        end)

      broadcast(updated_publication)

      {:ok, updated_publication}
    else
      {:error, %Ecto.Changeset{}} = error ->
        error

      {:ok, %{status: 409}} ->
        {
          :error,
          add_error(changeset, :duplicate_document, "Publication document version mismatch.")
        }
    end
  end

  def put(%__MODULE__{} = publication, params) do
    changeset = changeset(publication, params)

    with {:ok, %__MODULE__{_id: doc_id}} <- apply_action(changeset, :create),
         _ <- Cachex.del(:document_cache, doc_id),
         {:ok, %{status: 201}} <- CouchService.put_database(publication.database),
         {:ok, %{status: 201}} <- CouchService.put_document(publication.configuration_doc, %{}),
         {:ok, %{status: 201, body: body}} <- CouchService.put_document(doc_id, publication),
         [
           created: _index_name_a,
           created: _index_name_b
         ] <- Search.create_empty_indices(publication, true) do
      %{"rev" => rev} = Jason.decode!(body)
      {:ok, Map.put(publication, :_rev, rev)}
    else
      {:error, %Ecto.Changeset{}} = error ->
        error

      {:ok, %{status: 409}} ->
        {:error, add_error(changeset, :duplicate_document, "Publication already exists.")}

      {:ok, %{status: 412}} ->
        {:error,
         add_error(
           changeset,
           :database_exists,
           "A publication database '#{get_field(changeset, :database)}' already exists."
         )}
    end
  end

  def delete(
        %__MODULE__{
          _id: doc_id,
          _rev: rev,
          database: database
        } = publication
      ) do
    Cachex.del(:document_cache, doc_id)

    with {:ok, _preview_database_name} <-
           delete_meta_database(publication),
         {:ok, %{status: status}} when status in [200, 404] <-
           delete_configuration_doc(publication),
         _not_found_or_deleted <- Search.delete_indices(publication),
         {:ok, %{status: status}} when status in [200, 404] <-
           CouchService.delete_document(doc_id, rev),
         {:ok, %{status: status}} when status in [200, 404] <-
           CouchService.delete_database(database),
         :ok <- FileService.delete_hierarchy(publication),
         %{json: :ok, compressed: :ok} <-
           FileService.delete_geometry_collections(publication) do
      {:ok, :deleted}
    else
      error ->
        error
    end
  end

  defp delete_configuration_doc(%__MODULE__{configuration_doc: doc_id}) do
    CouchService.get_document(doc_id)
    |> case do
      {:ok, %{status: 404}} = response ->
        response

      {:ok, %{status: 200, body: body}} ->
        rev =
          body
          |> Jason.decode!()
          |> Map.get("_rev")

        CouchService.delete_document(doc_id, rev)
    end
  end

  def generate_task_channel_name(project_identifier, draft_date) do
    "#{project_identifier}_#{draft_date}_task"
  end

  def get_document_hierarchy(%__MODULE__{_id: pub_id} = publication) do
    hierarchy_cache = "hierarchy_#{pub_id}"

    Cachex.get(@document_cache_name, hierarchy_cache)
    |> case do
      {:ok, nil} ->
        path = FileService.publication_hierarchy_path(publication)

        hierarchy =
          if File.exists?(path) do
            Logger.debug("No active document cache for `#{pub_id}` hierarchy loading from file.")

            path
            |> File.read!()
            |> JSON.decode!()
          else
            Logger.debug("No active document cache for `#{pub_id}` hierarchy generating new one.")
            new = generate_hierarchy_mapping(publication)
            FileService.write_hierarchy(publication, new)
            new
          end

        Cachex.put(@document_cache_name, hierarchy_cache, hierarchy, ttl: 1000 * 60 * 60 * 24 * 7)

        hierarchy

      {:ok, cached} ->
        cached
    end
  end

  def get_document_hierarchy(uuid, %__MODULE__{} = publication) when is_binary(uuid) do
    get_document_hierarchy(publication)
    |> Map.get(uuid)
  end

  def get_document_hierarchy(uuids, %__MODULE__{} = publication) when is_list(uuids) do
    get_document_hierarchy(publication)
    |> Map.take(uuids)
  end

  def get_doc_stream_for_georeferenced(%__MODULE__{database: database}) do
    query = %{
      selector: %{
        "resource.georeference": %{
          "$ne": nil
        }
      }
    }

    CouchService.get_document_stream(query, database)
  end

  def get_doc_stream_for_all(%__MODULE__{database: database}) do
    CouchService.get_document_stream(
      %{
        selector: %{}
      },
      database
    )
  end

  def get_project_map_layers(%__MODULE__{database: database}) do
    %{
      selector: %{
        "resource.relations.isMapLayerOf": %{
          "$elemMatch": %{
            "$eq": "project"
          }
        }
      }
    }
    |> CouchService.get_document_stream(database)
    |> Enum.to_list()
  end

  def get_doc_count(%__MODULE__{database: db}, include_design_documents? \\ false) do
    document_count_overall =
      CouchService.get_database(db)
      |> case do
        {:ok, %{status: 200, body: body}} ->
          body
          |> Jason.decode!()
          |> Map.get("doc_count", 0)

        _ ->
          0
      end

    design_document_count =
      CouchService.all_design_docs(db)
      |> case do
        {:ok, %{status: 200, body: body}} ->
          body
          |> Jason.decode!()
          |> Map.get("total_rows", 0)

        _ ->
          0
      end

    if include_design_documents?,
      do: document_count_overall,
      else: document_count_overall - design_document_count
  end

  def get_raw_document(uuid, %__MODULE__{database: db}) do
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

  def get_raw_documents(uuids, %__MODULE__{database: db}) do
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

  def get_extended_document(uuid, %__MODULE__{} = publication, include_relations \\ false)
      when is_binary(uuid) do
    config = Configuration.get(publication)

    get_raw_document(uuid, publication)
    |> case do
      {:error, _} ->
        {:error, :not_found}

      doc ->
        Configuration.apply_project_configuration(doc, config, publication, include_relations)
    end
  end

  def get_extended_documents(
        uuids,
        %__MODULE__{} = publication,
        include_relations \\ false
      ) do
    config = Configuration.get(publication)

    uuids
    |> get_raw_documents(publication)
    |> Enum.map(
      &Configuration.apply_project_configuration(&1, config, publication, include_relations)
    )
  end

  # def list_with_geometries(%__MODULE__{} = publication) do
  #   db_name = get_meta_database_name(publication)

  #   CouchService.get_document_stream(
  #     %{
  #       selector: %{"preview.geometry": %{"$ne": nil}},
  #       use_index: "previews-with-geometry-index"
  #     },
  #     db_name
  #   )
  #   |> Stream.map(fn %{"preview" => preview} ->
  #     preview
  #   end)
  #   |> Stream.map(&Configuration.document_map_to_struct/1)
  # end

  def recreate_database_indices(%__MODULE__{database: database} = publication) do
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

  def document_exists?(uuid, %__MODULE__{database: db}) do
    CouchService.head_document(uuid, db)
    |> case do
      {:ok, %{status: 200}} ->
        true

      _ ->
        false
    end
  end

  def get_doc_stream_for_categories(%__MODULE__{database: database}, categories)
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

    CouchService.get_document_stream(query, database)
  end

  defp generate_hierarchy_mapping(%__MODULE__{_id: pub_id} = publication) do
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
        Map.update(acc, doc["_id"], %{"children" => [], "parent" => parent_uuid}, fn existing ->
          Map.put(existing, "parent", parent_uuid)
        end)

      # Update or initialize the parent
      if parent_uuid != nil do
        Map.update(
          acc,
          parent_uuid,
          %{"children" => [uuid], "parent" => nil},
          fn %{
               "children" => existing_children
             } = existing ->
            Map.put(existing, "children", existing_children ++ [uuid])
          end
        )
      else
        acc
      end
    end)
    |> Enum.into(%{})
  end

  def broadcast(%__MODULE__{_id: id} = publication) do
    PubSub.broadcast(
      FieldPublication.PubSub,
      id,
      {id, publication}
    )
  end

  def broadcast(%__MODULE__{_id: id}, msg) do
    PubSub.broadcast(
      FieldPublication.PubSub,
      id,
      {id, msg}
    )
  end
end
