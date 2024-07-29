defmodule FieldPublication.Projects do
  import Ecto.Changeset

  alias Ecto.Changeset

  alias FieldPublication.DatabaseSchema.{
    Base,
    Project,
    Publication
  }

  alias FieldPublication.CouchService
  alias FieldPublication.Users
  alias FieldPublication.FileService
  alias FieldPublication.Publications

  @moduledoc """
  Contains functions to retrieve, create, update and list projects within the FieldPublication system. Projects in this sense are used to control access
  to publications which in turn attach themselves to a project. This means the primary data in FieldPublication is not handled by this module, but by
  `FieldPublication.Publications` and its submodules.
  """

  @doc """
  Retrieve a project document by the projects name.

  Returns `{:ok, %FieldPublication.DatabaseSchema.Project{}}` on success, or `{:error, :not_found}` if a project of that name does not exist.

  ## Parameters
    - `name`: Name of the project as String.

  ## Examples
      iex> get("bourgou")
      {
        :ok,
        %FieldPublication.DatabaseSchema.Project{
          _rev: "8-9bfcc2fc1c746216c79a47936b9d4d96",
          name: "bourgou",
          doc_type: "project",
          editors: []
        }
      }

      iex> get("bourgou")
      {:error, :not_found}
  """
  def get(name) when is_binary(name) do
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

  @doc """
  Retrieve a project document by the projects name.

  Returns a `%FieldPublication.DatabaseSchema.Project{}` schema struct or raises an expection if the project was not found.

  ## Parameters
    - `name`: Name of the project as String.

  ## Examples
      iex> get!("bourgou")
      %FieldPublication.DatabaseSchema.Project{
        _rev: "8-9bfcc2fc1c746216c79a47936b9d4d96",
        name: "bourgou",
        doc_type: "project",
        editors: []
      }

      iex> get("bourgou")
      ** (MatchError) no match of right hand side value: {:error, :not_found} (..)
  """
  def get!(name) do
    {:ok, project} = get(name)
    project
  end

  @doc """
  List a projects in the database.

  Returns a list of all  `%FieldPublication.DatabaseSchema.Project{}` schema structs in the database.

  ## Examples
      iex> list()
      [
        %FieldPublication.DatabaseSchema.Project{
          _rev: "8-9bfcc2fc1c746216c79a47936b9d4d96",
          name: "bourgou",
          doc_type: "project",
          editors: []
        },
        (...)
      ]
  """
  def list() do
    CouchService.get_document_stream(%{selector: %{doc_type: Project.doc_type()}})
    |> Enum.map(fn doc ->
      Project.changeset(%Project{}, doc)
      |> apply_changes()
    end)
  end

  @doc """
  Create or update a project. This initializes the both the database document and the FileService directories.

  Returns either `{:ok, %FieldPublication.DatabaseSchema.Project{}}` containing the update document on success, or `{:error, changeset}` if
  the update failed due to document revision missmatch.

  The function may also raise an exception if FieldPublication fails to create the project's file directories.

  ## Parameters
    - `project`: The project schema struct.
    - `params` (optional): A map containing values that should be updated in the given struct.

  ## Example
  ### (1) Creating a new project document.
      iex> FieldPublication.Projects.put(%FieldPublication.DatabaseSchema.Project{}, %{"name" => "my_new_project", "editors" => ["some_user"]})
      {:ok,
      %FieldPublication.DatabaseSchema.Project{
        _rev: "1-efb39394b265b932a1c0d3d6ae3c2e6d",
        name: "my_new_project",
        doc_type: "project",
        editors: ["some_user"]
      }}

  ### (2) Attempting to create a new project document without a project name.
      iex> FieldPublication.Projects.put(%FieldPublication.DatabaseSchema.Project{}, %{"editors" => ["some_user"]})
      {:error,
      #Ecto.Changeset<
        action: :create,
        changes: %{editors: ["some_user"]},
        errors: [name: {"can't be blank", [validation: :required]}],
        data: #FieldPublication.DatabaseSchema.Project<>,
        valid?: false
      >}

  ### (3) Updating an existing project document.
      bourgou = FieldPublication.Projects.get!("bourgou")
      %FieldPublication.DatabaseSchema.Project{
        _rev: "8-9bfcc2fc1c746216c79a47936b9d4d96",
        name: "bourgou",
        doc_type: "project",
        editors: []
      }

      FieldPublication.Projects.put(bourgou, %{"editors" => ["some_user"]})
      {:ok,
      %FieldPublication.DatabaseSchema.Project{
        _rev: "9-b5deb5d3c32e9638554cd9c9cf76ce2e",
        name: "bourgou",
        doc_type: "project",
        editors: ["some_user"]
      }}
  """
  def put(%Project{} = project, params \\ %{}) do
    changeset = Project.changeset(project, params)

    with {:ok, project} <- apply_action(changeset, :create),
         id <- get_document_id(project),
         {:ok, %{status: 201, body: body}} <- CouchService.put_document(id, project) do
      %{"rev" => rev} = Jason.decode!(body)
      FileService.initialize!(project.name)
      {:ok, Map.put(project, :_rev, rev)}
    else
      {:error, %Changeset{} = _changeset} = error ->
        # The provided struct was invalid based on the `%Project{}` changeset definition, return the `{:error, changeset}` tuple.
        error

      {:ok, %{status: 409}} ->
        # CouchDB responded with a conflict status. Add a custom error to the changeset and also return an `{:error, changeset}` tuple.
        changeset
        |> add_error(
          :name,
          "a project with this name already exists, the provided document revision does not match the existing"
        )
        |> apply_action(:create)
    end
  end

  @doc """
  Delete a project and all its publications, clears both the database and the file system.

  Returns `{:ok, deleted}`.

  ## Parameters
    - `project`: The project schema struct.

  ## Example
      iex(0)> project = FieldPublication.Projects.get!("my_doomed_project")
      %FieldPublication.DatabaseSchema.Project{
        _rev: "1-efb39394b265b932a1c0d3d6ae3c2e6d",
        name: "my_doomed_project",
        doc_type: "project",
        editors: ["some_user"]
      }
      iex(1)> FieldPublication.Projects.delete(project)
      {:ok, :deleted}
  """
  def delete(%Project{_rev: rev, name: name} = project) do
    doc_id = get_document_id(project)

    {:ok, _deleted_paths} = FileService.delete(name)
    CouchService.delete_document(doc_id, rev)
    publications = Publications.list(project.name)
    Enum.each(publications, &Publications.delete(&1))

    {:ok, :deleted}
  end

  @doc """
  Checks if a given user has access to a project.

  Returns `true` or `false`.

  ## Parameters
    - `project_name`: Name of the project as a string.
    - `user_name`: Name of the user as a string or `nil`.
  """
  def has_project_access?(_project_name, user_name) when is_nil(user_name) do
    false
  end

  def has_project_access?(project_name, user_name)
      when is_binary(project_name) and is_binary(user_name) do
    if Users.is_admin?(user_name) do
      true
    else
      project = get!(project_name)
      user_name in project.editors
    end
  end

  @doc """
  Checks if a given user has access to a given publication.

  Returns `true` or `false`.

  ## Parameters
    - `publication`: Publication schema struct of the publication.
    - `user_name`: Name of the user as a string or `nil`.
  """
  def has_publication_access?(%Publication{publication_date: date} = _publication, nil) do
    date != nil and not Date.after?(date, Date.utc_today())
  end

  def has_publication_access?(%Publication{} = publication, user_name)
      when is_binary(user_name) do
    access? = has_project_access?(publication.project_name, user_name)
    date = publication.publication_date

    cond do
      access? ->
        true

      date != nil and not Date.after?(date, Date.utc_today()) ->
        true

      true ->
        false
    end
  end

  @doc """
  Returns a standardized document id for the project struct.

  ## Parameters
    - `project`: Project schema struct.
  """
  def get_document_id(%Project{} = project) do
    Base.construct_doc_id(project, Project)
  end
end
