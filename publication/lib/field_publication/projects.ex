defmodule FieldPublication.Projects do
  import Ecto.Changeset

  alias FieldPublication.Schemas
  alias FieldPublication.Schemas.Project
  alias FieldPublication.CouchService
  alias FieldPublication.User
  alias FieldPublication.FileService
  alias FieldPublication.Publications

  def get(name) do
    %Project{
      name: name,
      doc_type: Project.doc_type()
    }
    |> get_document_id()
    |> CouchService.get_document()
    |> case do
      {:ok, %{status: 200, body: body}} ->
        json_doc = Jason.decode!(body)

        {
          :ok,
          apply_changes(Project.changeset(%Project{}, json_doc))
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
    CouchService.run_find_query(%{selector: %{doc_type: Project.doc_type()}})
    |> case do
      {:ok, %{status: 200, body: body}} ->
        body
        |> Jason.decode!()
        |> then(fn %{"docs" => docs} ->
          docs
        end)
        |> Enum.map(fn doc ->
          Project.changeset(%Project{}, doc)
          |> apply_changes()
        end)
    end
  end

  def put(%Project{} = struct, params \\ %{}) do
    changeset = Project.changeset(struct, params)

    with {:ok, project} <- apply_action(changeset, :create),
         id <- get_document_id(project),
         [:ok, :ok] <- FileService.initialize(project.name),
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

  def delete(%Project{_rev: rev, name: name} = project) do
    doc_id = get_document_id(project)

    with {:ok, _deleted_paths} = FileService.delete(name),
         {:ok, %{status: status}} when status in [200, 404] <-
           CouchService.delete_document(doc_id, rev),
          publications <- Publications.list(project)
          do
        Enum.each(publications, &Publications.delete(&1))

      {:ok, :deleted}
    else
      error ->
        error
    end
  end

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

  def get_document_id(%Project{} = struct) do
    Schemas.construct_doc_id(struct, Project)
  end
end
