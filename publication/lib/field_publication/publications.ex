defmodule FieldPublication.Publications do
  import Ecto.Changeset

  alias FieldPublication.CouchService
  alias FieldPublication.OpenSearchService
  alias FieldPublication.Projects

  alias FieldPublication.DatabaseSchema.{
    ReplicationInput,
    Publication,
    Base
  }

  @doc """
  Initializes a new publication based on some user input.
  """
  def create_from_replication_input(%ReplicationInput{
        source_url: source_url,
        source_project_name: source_project_name,
        project_name: project_name,
        delete_existing_publication: delete_existing,
        drafted_by: drafted_by
      }) do
    draft_date = Date.utc_today()

    changeset =
      %Publication{
        project_name: project_name,
        source_url: source_url,
        source_project_name: source_project_name,
        configuration_doc: "configuration_#{project_name}_#{draft_date}",
        hierarchy_doc: "hierarchy_#{project_name}_#{draft_date}",
        database: "publication_#{project_name}_#{draft_date}",
        draft_date: draft_date,
        drafted_by: drafted_by
      }
      |> Publication.changeset()

    case apply_action(changeset, :create) do
      {:ok, publication} ->
        if delete_existing do
          get(project_name, draft_date)
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

  def get(project_name, draft_date) when is_binary(draft_date) and is_binary(project_name) do
    get(project_name, Date.from_iso8601!(draft_date))
  end

  def get(project_name, %Date{} = draft_date) when is_binary(project_name) do
    doc_id =
      %Publication{
        project_name: project_name,
        draft_date: draft_date,
        doc_type: Publication.doc_type()
      }
      |> get_doc_id()

    Cachex.get(:document_cache, doc_id)
    |> case do
      {:ok, nil} ->
        doc_id
        |> CouchService.get_document()
        |> case do
          {:ok, %{status: 200, body: body}} ->
            json_doc = Jason.decode!(body)

            publication = apply_changes(Publication.changeset(%Publication{}, json_doc))
            Cachex.put(:document_cache, doc_id, publication, ttl: 1000 * 60 * 60 * 24 * 7)

            {:ok, publication}

          {:ok, %{status: 404}} ->
            {:error, :not_found}
        end

      {:ok, cached} ->
        {:ok, cached}
    end
  end

  def get!(project_name, draft_date) do
    {:ok, publication} = get(project_name, draft_date)
    publication
  end

  def get_configuration(%Publication{configuration_doc: config_name}) do
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

  def get_hierarchy(%Publication{hierarchy_doc: hierarchy_doc_name}) do
    Cachex.get(:document_cache, hierarchy_doc_name)
    |> case do
      {:ok, nil} ->
        hierarchy =
          CouchService.get_document(hierarchy_doc_name)
          |> then(fn {:ok, %{body: body}} ->
            Jason.decode!(body)
          end)
          |> Map.get("hierarchy", [])

        Cachex.put(:document_cache, hierarchy_doc_name, hierarchy, ttl: 1000 * 60 * 60 * 24 * 7)

        hierarchy

      {:ok, cached} ->
        cached
    end
  end

  def get_published(project_name) do
    list(project_name)
    |> Stream.reject(fn %Publication{} = pub -> pub.publication_date == nil end)
    |> Enum.sort(fn %Publication{publication_date: a}, %Publication{publication_date: b} ->
      Date.compare(a, b) in [:eq, :gt]
    end)
  end

  def get_current_published() do
    list()
    |> Enum.group_by(fn val -> val.project_name end)
    |> Stream.map(fn {_project_name, publications} ->
      publications
      |> Stream.reject(fn %Publication{} = pub -> pub.publication_date == nil end)
      |> Enum.sort(fn %Publication{publication_date: a}, %Publication{publication_date: b} ->
        Date.compare(a, b) in [:eq, :gt]
      end)
      |> List.first(:none)
    end)
    |> Enum.reject(fn val -> val == :none end)
  end

  def get_current_published(project_name) do
    project_name
    |> get_published()
    |> List.first(:none)
  end

  @doc """
  Returns the most recent publication(s) based on user's access rights and
  the draft date.
  """
  def get_most_recent(project_name \\ :all, user_name \\ nil)

  def get_most_recent(:all, user_name) do
    list()
    |> Enum.group_by(fn val -> val.project_name end)
    |> Stream.map(fn {_project_name, publications} ->
      publications
      |> Stream.filter(fn %Publication{} = pub ->
        Projects.has_publication_access?(pub, user_name)
      end)
      |> Enum.sort(fn %Publication{draft_date: a}, %Publication{draft_date: b} ->
        Date.compare(a, b) in [:eq, :gt]
      end)
      |> List.first()
    end)
    |> Enum.reject(fn val -> val == nil end)
  end

  def get_most_recent(project_name, user_name) do
    list(project_name)
    |> Stream.filter(fn publication ->
      Projects.has_publication_access?(publication, user_name)
    end)
    |> Enum.sort(fn %Publication{draft_date: a}, %Publication{draft_date: b} ->
      Date.compare(a, b) in [:eq, :gt]
    end)
    |> List.first()
  end

  def list() do
    run_search(%{selector: %{doc_type: Publication.doc_type()}})
  end

  def list(project_name) when is_binary(project_name) do
    run_search(%{selector: %{doc_type: Publication.doc_type(), project_name: project_name}})
  end

  defp run_search(query) do
    CouchService.get_document_stream(query)
    |> Enum.map(fn doc ->
      Publication.changeset(%Publication{}, doc)
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

  def put(%Publication{_rev: rev} = publication, params) when not is_nil(rev) do
    # If revision is not nil, this is an update to an existing publication. No need to to create documents, initializes search indices etc.
    changeset = Publication.changeset(publication, params)
    doc_id = get_doc_id(publication)

    Cachex.del(:document_cache, doc_id)

    with {:ok, publication} <- apply_action(changeset, :create),
         {:ok, %{status: 201, body: body}} <- CouchService.put_document(doc_id, publication) do
      %{"rev" => rev} = Jason.decode!(body)
      {:ok, Map.put(publication, :_rev, rev)}
    else
      {:error, %Ecto.Changeset{}} = error ->
        error

      {:ok, %{status: 409}} ->
        {:error, Base.add_duplicate_doc_error(changeset)}
    end
  end

  def put(%Publication{} = publication, params) do
    changeset = Publication.changeset(publication, params)

    with {:ok, publication} <- apply_action(changeset, :create),
         doc_id <- get_doc_id(publication),
         _ <- Cachex.del(:document_cache, doc_id),
         {:ok, %{status: 201}} <- CouchService.put_database(publication.database),
         {:ok, %{status: 201}} <- CouchService.put_document(publication.configuration_doc, %{}),
         {:ok, %{status: 201}} <- CouchService.put_document(publication.hierarchy_doc, %{}),
         {:ok, %{status: 201, body: body}} <- CouchService.put_document(doc_id, publication),
         {:ok, %{status: 200}} <- OpenSearchService.initialize_publication_indices(publication) do
      %{"rev" => rev} = Jason.decode!(body)
      {:ok, Map.put(publication, :_rev, rev)}
    else
      {:error, %Ecto.Changeset{}} = error ->
        error

      {:ok, %{status: 409}} ->
        {:error, Base.add_duplicate_doc_error(changeset)}

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
        %Publication{
          _rev: rev,
          database: database
        } = publication
      ) do
    doc_id = get_doc_id(publication)
    Cachex.del(:document_cache, doc_id)

    with {:ok, %{status: status}} when status in [200, 404] <-
           CouchService.delete_document(doc_id, rev),
         {:ok, %{status: status}} when status in [200, 404] <-
           delete_configuration_doc(publication),
         {:ok, %{status: status}} when status in [200, 404] <-
           delete_hierarchy_doc(publication),
         {:ok, %{status: status}} when status in [200, 404] <-
           CouchService.delete_database(database) do
      {:ok, :deleted}
    else
      error ->
        error
    end
  end

  defp delete_configuration_doc(%Publication{configuration_doc: doc_id}) do
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

  defp delete_hierarchy_doc(%Publication{hierarchy_doc: doc_id}) do
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

  def generate_task_channel_name(project_key, draft_date) do
    "#{project_key}_#{draft_date}_task"
  end

  def get_doc_id(publication) do
    Base.construct_doc_id(publication, Publication)
  end
end
