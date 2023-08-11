defmodule FieldPublication.Projects do
  @moduledoc """
  The Projects context.
  """

  import Ecto.Query, warn: false

  alias FieldPublication.Projects.Project
  alias FieldPublication.CouchService

  alias FieldPublication.Worker.Replicator

  @doc """
  Returns the list of projects.

  ## Examples

      iex> list_projects()
      [%Project{}, ...]

  """
  def list_projects() do

    CouchService.find_documents(%{type: "project"})
    |> case do
      {:ok, %Finch.Response{ status: 200, body: body}} ->
        Jason.decode!(body)
        |> then(fn %{"docs" => docs} -> docs end)
        |> Enum.map(fn (doc) ->
          {:ok, project} = Project.create(doc)
          project
        end)
    end
    |> IO.inspect()
  end

  @doc """
  Gets a single project.

  Raises `Ecto.NoResultsError` if the Project does not exist.

  ## Examples

      iex> get_project!(123)
      %Project{}

      iex> get_project!(456)
      ** (Ecto.NoResultsError)

  """
  def get_project!(id) do
    id
    |> CouchService.retrieve_document()
    |> case do
      {:ok, %Finch.Response{ status: 200, body: body }} ->
        body
        |> Jason.decode!()
        |> Project.create()
      end
    |> IO.inspect()
  end

  @doc """
  Creates a project.

  ## Examples

      iex> create_project(%{field: value})
      {:ok, %Project{}}

      iex> create_project(%{field: bad_value})
      {:error, %Ecto.Changeset{}}

  """
  def create_project(attrs \\ %{}) do
    attrs
    |> Project.create()
    |> case do
      {:ok, %Project{} = project} ->
        CouchService.store_document(
          project._id,
          project
        )
        |> case do
          {:ok, %Finch.Response{ status: 201 }} ->
            {:ok, project}
          {:ok, %Finch.Response{ status: 409 }} ->
            %Project{}
            |> Project.changeset(attrs)
            |> Ecto.Changeset.add_error(:document_exists, "A document with id #{project._id} already exists.")
        end
      {:error, _changeset_with_errors} = error ->
        error
    end
    |> IO.inspect()
  end

  @doc """
  Updates a project.

  ## Examples

      iex> update_project(project, %{field: new_value})
      {:ok, %Project{}}

      iex> update_project(project, %{field: bad_value})
      {:error, %Ecto.Changeset{}}

  """
  def update_project(%Project{} = project, attrs) do
    project
    |> Project.update(attrs)
    |> case do
      {:ok, %Project{} = project} ->
        CouchService.store_document(
          project._id,
          project
        )
        |> case do
          {:ok, %Finch.Response{ status: 201 }} ->
            {:ok, project}
          {:ok, %Finch.Response{ status: 409 } = response } ->
            IO.inspect(response)

            project
            |> Project.changeset(attrs)
            |> Ecto.Changeset.add_error(:document_exists, "A document with id #{project._id} already exists.")
        end
      {:error, _changeset_with_errors} = error ->
        error
    end
    |> IO.inspect()
  end

  @doc """
  Deletes a project.

  ## Examples

      iex> delete_project(project)
      {:ok, %Project{}}

      iex> delete_project(project)
      {:error, %Ecto.Changeset{}}

  """
  def delete_project(%Project{} = project) do
    CouchService.delete_document(project._id)
    |> IO.inspect()
  end

  @doc """
  Returns an `%Ecto.Changeset{}` for tracking project changes.

  ## Examples

      iex> change_project(project)
      %Ecto.Changeset{data: %Project{}}

  """
  def change_project(%Project{} = project, attrs \\ %{}) do
    Project.changeset(project, attrs)
  end

  def check_project_authorization(project_name, user_name) do
    project_name
    |> get_project_document("users")
    |> case do
      {:ok, users} ->
        if user_name in users["members"] do
          :granted
        else
          :denied
        end

      _ ->
        :denied
    end
  end

  defp get_project_document(project_name, doc_id) do
    CouchService.retrieve_document(project_name, doc_id)
    |> case do
      {:ok, %Finch.Response{body: body, status: 200}} ->
        body
        |> Jason.decode()

      {:ok, %Finch.Response{status: 404}} ->
        {:error, :document_not_found}
    end
  end
end
