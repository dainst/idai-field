defmodule FieldPublication.Schemas.Project do
  use Ecto.Schema

  import Ecto.Changeset

  alias FieldPublication.Schemas
  alias FieldPublication.CouchService
  alias FieldPublication.User

  @doc_type "project"
  @primary_key false
  embedded_schema do
    field(:_rev, :string)
    field(:name, :string, primary_key: true)
    field(:doc_type, :string, default: @doc_type)
    field(:hidden, :boolean, default: true)
    field(:editors, {:array, :string}, default: [])
  end

  @doc false
  def changeset(project, attrs \\ %{}) do
    project
    |> cast(attrs, [:name, :_rev, :hidden, :editors])
    |> validate_required([:name])
    |> Schemas.validate_doc_type(@doc_type)
  end

  def get(name) do
    %__MODULE__{
      name: name,
      doc_type: @doc_type
    }
    |> get_document_id()
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

  def get!(name) do
    {:ok, project} = get(name)
    project
  end

  def list() do
    CouchService.run_find_query(%{selector: %{doc_type: @doc_type}})
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

  def put(%__MODULE__{} = struct, params \\ %{}) do
    changeset = changeset(struct, params)

    with {:ok, project} <- apply_action(changeset, :create),
         id <- get_document_id(project),
         {:ok, %{status: 201, body: body}} <- CouchService.put_document(id, project) do
      %{"rev" => rev} = Jason.decode!(body)
      {:ok, Map.put(project, :_rev, rev)}
    else
      {:error, %Ecto.Changeset{}} = error ->
        error

      {:ok, %{status: 409}} ->
        {:error, Schemas.add_duplicate_doc_error(changeset)}
    end
  end

  # def update_project(%__MODULE__{} = old_project, update_params \\ %{}) do
  #   old_project
  #   |> changeset(update_params)
  #   |> apply_action(:update)
  #   |> case do
  #     {:error, _changeset} = error ->
  #       error

  #     {:ok, updated_project} ->
  #       get_document_id(updated_project)
  #       |> CouchService.put_document(updated_project)
  #       |> case do
  #         {:ok, %{status: 201, body: body}} ->
  #           new_rev =
  #             body
  #             |> Jason.decode!()
  #             |> Map.get("rev")

  #           # Update the CouchDB document revision that changed with the successful `CouchService.put_document/1` above.
  #           {:ok, Map.put(updated_project, :_rev, new_rev)}
  #       end
  #   end
  # end

  def delete(%__MODULE__{_rev: rev} = project) do
    project
    |> get_document_id()
    |> CouchService.delete_document(rev)
    |> case do
      {:ok, %{status: 200}} ->
        {:ok, :deleted}

      {:ok, %{status: 404}} ->
        {:error, :not_found}

      {:ok, %{status: 409}} ->
        {:error, :rev_mismatch}
    end
  end

  # def add_publication(%__MODULE__{} = project, %Publication{} = new_publication) do
  #   filtered =
  #     project.publications
  #     |> Enum.reject(fn %Publication{} = existing ->
  #       Date.compare(existing.draft_date, new_publication.draft_date) == :eq
  #     end)

  #   updated =
  #     (filtered ++ [new_publication])
  #     |> Enum.sort(fn a, b -> a.draft_date > b.draft_date end)

  #   Map.replace(project, :publications, updated)
  #   |> update_project()
  # end

  # def remove_publication(%__MODULE__{} = project, %Publication{} = removed_publication) do
  #   filtered =
  #     project.publications
  #     |> Enum.reject(fn %Publication{} = existing ->
  #       Date.compare(existing.draft_date, removed_publication.draft_date) == :eq
  #     end)

  #   removed_publication.database
  #   |> CouchService.delete_database()

  #   removed_publication.configuration_doc
  #   |> CouchService.get_document()
  #   |> then(fn {:ok, %{status: 200, body: body}} -> Jason.decode!(body) end)
  #   |> then(fn %{"_id" => id, "_rev" => rev} ->
  #     CouchService.delete_document(id, rev)
  #   end)

  #   FileService.delete_publication(project.name, removed_publication.draft_date)

  #   Map.replace(project, :publications, filtered)
  #   |> update_project()
  # end

  # def find_publication_by_draft_date(project, date) do
  #   project.publications
  #   |> Enum.find(fn pub ->
  #     Date.compare(pub.draft_date, date) == :eq
  #   end)
  # end

  def has_project_access?(_project_name, nil) do
    false
  end

  def has_project_access?(project_name, user_name) do
    if User.is_admin?(user_name) do
      true
    else
      project = get!(project_name)
      user_name in project.editors
    end
  end

  def get_document_id(%__MODULE__{} = struct) do
    Schemas.construct_doc_id(struct, __MODULE__)
  end
end
