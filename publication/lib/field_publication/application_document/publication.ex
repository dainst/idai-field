defmodule FieldPublication.Schemas.Publication do
  use Ecto.Schema

  import Ecto.Changeset

  alias FieldPublication.{
    Schemas,
    CouchService,
    FileService
  }

  alias FieldPublication.Schemas.{
    ReplicationInput,
    Project,
    Translation,
    LogEntry
  }

  @doc_type "publication"
  @primary_key false
  embedded_schema do
    field(:_rev, :string)
    field(:doc_type, :string, default: @doc_type)
    field(:project_name, :string, primary_key: true)
    field(:source_url, :string)
    field(:source_project_name, :string)
    field(:draft_date, :date, primary_key: true)
    field(:publication_date, :date)
    field(:configuration_doc, :string)
    field(:database, :string)
    embeds_many(:comments, Translation, on_replace: :delete)
    embeds_many(:replication_logs, LogEntry, on_replace: :delete)
    embeds_many(:processing_logs, LogEntry, on_replace: :delete)
  end

  def changeset(publication, attrs \\ %{}) do
    publication
    |> cast(attrs, [
      :_rev,
      :project_name,
      :source_url,
      :source_project_name,
      :draft_date,
      :publication_date,
      :configuration_doc,
      :database
    ])
    |> cast_embed(:comments)
    |> cast_embed(:replication_logs)
    |> cast_embed(:processing_logs)
    |> validate_required([
      :project_name,
      :source_url,
      :source_project_name,
      :draft_date,
      :configuration_doc,
      :database
    ])
    |> validate_project_exists()
    |> Schemas.validate_doc_type(@doc_type)
  end

  def create_from_replication_input(%ReplicationInput{
        source_url: source_url,
        source_project_name: source_project_name,
        project_name: project_name,
        comments: comments,
        delete_existing_publication: delete_existing
      }) do
    draft_date = Date.utc_today()

    changeset =
      %__MODULE__{
        project_name: project_name,
        source_url: source_url,
        source_project_name: source_project_name,
        configuration_doc: "configuration_#{project_name}_#{draft_date}",
        database: "publication_#{project_name}_#{draft_date}",
        draft_date: draft_date,
        comments: comments
      }
      |> changeset()

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
    %__MODULE__{
      project_name: project_name,
      draft_date: draft_date,
      doc_type: @doc_type
    }
    |> get_doc_id()
    |> CouchService.get_document()
    |> case do
      {:ok, %{status: 200, body: body}} ->
        json_doc = Jason.decode!(body)

        {
          :ok,
          apply_changes(changeset(%__MODULE__{}, json_doc))
        }

      {:ok, %{status: 404}} ->
        {:error, :not_found}
    end
  end

  def get!(project_name, draft_date) do
    {:ok, publication} = get(project_name, draft_date)
    publication
  end

  def list() do
    run_search(%{selector: %{doc_type: @doc_type}})
  end

  def list(%Project{name: name}) do
    run_search(%{selector: %{doc_type: @doc_type, project_name: name}})
  end

  defp run_search(query) do
    CouchService.run_find_query(query)
    |> case do
      {:ok, %{status: 200, body: body}} ->
        body
        |> Jason.decode!()
        |> then(fn %{"docs" => docs} ->
          docs
        end)
        |> Enum.map(fn doc ->
          changeset(%__MODULE__{}, doc)
          |> apply_changes()
        end)
    end
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

  def put(%__MODULE__{_rev: rev} = publication, params) when not is_nil(rev) do
    changeset = changeset(publication, params)
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

  def put(%__MODULE__{} = publication, params) do
    changeset = changeset(publication, params)

    with {:ok, publication} <- apply_action(changeset, :create),
         doc_id <- get_doc_id(publication),
         {:ok, %{status: 201}} <- CouchService.create_database(publication.database),
         {:ok, %{status: 201}} <- CouchService.put_document(publication.configuration_doc, %{}),
         :ok <-
           FileService.initialize_publication(publication.project_name, publication.draft_date),
         {:ok, %{status: 201, body: body}} <- CouchService.put_document(doc_id, publication) do
      %{"rev" => rev} = Jason.decode!(body)
      {:ok, Map.put(publication, :_rev, rev)}
    else
      {:error, %Ecto.Changeset{}} = error ->
        error

      {:ok, %{status: 409}} ->
        {:error, Schemas.add_duplicate_doc_error(changeset)}


      {:ok, %{status: 412}} ->
        {:error, add_error(
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
        %__MODULE__{
          _rev: rev,
          database: database,
          project_name: project_name,
          draft_date: draft_date
        } = publication
      ) do
    doc_id = get_doc_id(publication)

    with {:ok, %{status: status}} when status in [200, 404] <-
           CouchService.delete_document(doc_id, rev),
         {:ok, %{status: status}} when status in [200, 404] <-
           delete_configuration_doc(publication),
         {:ok, %{status: status}} when status in [200, 404] <-
           CouchService.delete_database(database),
         {:ok, _} = FileService.delete_publication(project_name, draft_date) do
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

  def generate_task_channel_name(project_key, draft_date) do
    "#{project_key}_#{draft_date}_task"
  end

  def get_doc_id(publication) do
    Schemas.construct_doc_id(publication, __MODULE__)
  end

  defp validate_project_exists(changeset) do
    name = get_field(changeset, :project_name)

    Project.get(name)
    |> case do
      {:ok, _project} ->
        changeset

      {:error, :not_found} ->
        add_error(changeset, :project_name, "Project #{name} document not found.")
    end
  end
end
