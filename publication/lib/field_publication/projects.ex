defmodule FieldPublication.Projects do
  import Ecto.Changeset

  alias FieldPublication.DocumentSchema.Base
  alias FieldPublication.DocumentSchema.Project
  alias FieldPublication.CouchService
  alias FieldPublication.Users
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
    CouchService.get_document_stream(%{selector: %{doc_type: Project.doc_type()}})
    |> Enum.map(fn doc ->
      Project.changeset(%Project{}, doc)
      |> apply_changes()
    end)
  end

  def put(%Project{} = struct, params \\ %{}) do
    changeset = Project.changeset(struct, params)

    with {:ok, project} <- apply_action(changeset, :create),
         id <- get_document_id(project),
         [:ok, :ok, :ok] <- FileService.initialize(project.name),
         {:ok, %{status: 201, body: body}} <- CouchService.put_document(id, project) do
      %{"rev" => rev} = Jason.decode!(body)
      {:ok, Map.put(project, :_rev, rev)}
    else
      {:ok, %{status: 409}} ->
        changeset
        |> add_error(:name, "a project with this name already exists")
        |> apply_action(:create)

      error ->
        error
    end
  end

  def delete(%Project{_rev: rev, name: name} = project) do
    doc_id = get_document_id(project)

    with {:ok, _deleted_paths} = FileService.delete(name),
         {:ok, %{status: status}} when status in [200, 404] <-
           CouchService.delete_document(doc_id, rev),
         publications <- Publications.list(project) do
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
    if Users.is_admin?(user_name) do
      true
    else
      project = get!(project_name)
      user_name in project.editors
    end
  end

  def get_document_id(%Project{} = struct) do
    Base.construct_doc_id(struct, Project)
  end
end
