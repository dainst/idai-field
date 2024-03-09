defmodule FieldPublication.Publications do
  import Ecto.Changeset

  alias FieldPublication.{
    Schemas,
    CouchService
  }

  alias FieldPublication.Schemas.{
    ReplicationInput,
    Project,
    Publication
  }

  def create_from_replication_input(%ReplicationInput{
        source_url: source_url,
        source_project_name: source_project_name,
        project_name: project_name,
        delete_existing_publication: delete_existing
      }) do
    draft_date = Date.utc_today()

    changeset =
      %Publication{
        project_name: project_name,
        source_url: source_url,
        source_project_name: source_project_name,
        configuration_doc: "configuration_#{project_name}_#{draft_date}",
        database: "publication_#{project_name}_#{draft_date}",
        draft_date: draft_date
      }
      |> Publication.changeset()

    case apply_action(changeset, :create) do
      {:ok, publication} ->
        if delete_existing do
          get(project_name, draft_date)
          |> case do
            {:ok, existing} ->
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
    %Publication{
      project_name: project_name,
      draft_date: draft_date,
      doc_type: Publication.doc_type()
    }
    |> get_doc_id()
    |> CouchService.get_document()
    |> case do
      {:ok, %{status: 200, body: body}} ->
        json_doc = Jason.decode!(body)

        {
          :ok,
          apply_changes(Publication.changeset(%Publication{}, json_doc))
        }

      {:ok, %{status: 404}} ->
        {:error, :not_found}
    end
  end

  def get!(project_name, draft_date) do
    {:ok, publication} = get(project_name, draft_date)
    publication
  end

  def get!(%Publication{project_name: project_name, draft_date: draft_date}) do
    get!(project_name, draft_date)
  end

  def get_current_published(project_name) when is_binary(project_name) do
    project_name
    |> list()
    |> Enum.reject(fn %Publication{publication_date: date} ->
      date == nil or Date.before?(date, Date.utc_today())
    end)
    |> List.first(:none)
  end

  def list() do
    run_search(%{selector: %{doc_type: Publication.doc_type()}})
  end

  def list(name) when is_binary(name) do
    run_search(%{selector: %{doc_type: Publication.doc_type(), project_name: name}})
  end

  def list(%Project{name: name}) do
    run_search(%{selector: %{doc_type: Publication.doc_type(), project_name: name}})
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
    changeset = Publication.changeset(publication, params)

    with {:ok, publication} <- apply_action(changeset, :create),
         doc_id <- get_doc_id(publication),
         {:ok, %{status: 201, body: body}} <- CouchService.put_document(doc_id, publication) do
      %{"rev" => rev} = Jason.decode!(body)
      {:ok, Map.put(publication, :_rev, rev)}
    else
      {:error, %Ecto.Changeset{}} = error ->
        error

      {:ok, %{status: 409}} ->
        {:error, Schemas.add_duplicate_doc_error(changeset)}
    end
  end

  def put(%Publication{} = publication, params) do
    changeset = Publication.changeset(publication, params)

    with {:ok, publication} <- apply_action(changeset, :create),
         doc_id <- get_doc_id(publication),
         {:ok, %{status: 201}} <- CouchService.put_database(publication.database),
         {:ok, %{status: 201}} <- CouchService.put_document(publication.configuration_doc, %{}),
         {:ok, %{status: 201, body: body}} <- CouchService.put_document(doc_id, publication) do
      %{"rev" => rev} = Jason.decode!(body)
      {:ok, Map.put(publication, :_rev, rev)}
    else
      {:error, %Ecto.Changeset{}} = error ->
        error

      {:ok, %{status: 409}} ->
        {:error, Schemas.add_duplicate_doc_error(changeset)}

      {:ok, %{status: 412}} ->
        {:error,
         add_error(
           changeset,
           :database_exists,
           "A publication database '#{get_field(changeset, :database)}' already exists."
         )}

      {:error, posix} when is_atom(posix) ->
        {:error,
         add_error(
           changeset,
           :posix_error,
           "Got '#{posix}' while trying to initialize file directory."
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

    with {:ok, %{status: status}} when status in [200, 404] <-
           CouchService.delete_document(doc_id, rev),
         {:ok, %{status: status}} when status in [200, 404] <-
           delete_configuration_doc(publication),
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

  def generate_task_channel_name(project_key, draft_date) do
    "#{project_key}_#{draft_date}_task"
  end

  def get_doc_id(publication) do
    Schemas.construct_doc_id(publication, Publication)
  end
end
