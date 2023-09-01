defimpl Jason.Encoder, for: [
  FieldPublication.Documents.Project,
  FieldPublication.Documents.Publication
] do
  def encode(%{id: id} = document, opts) do

    document
    |> Map.from_struct()
    |> Map.reject(fn {k, v} -> k == :_rev and is_nil(v) end)
    |> Map.put(:_id, id)
    |> Jason.Encode.map(opts)
  end
end

defmodule FieldPublication.Documents do
  alias FieldPublication.CouchService

  alias FieldPublication.Documents.{
    Project,
    Publication
  }

  import Ecto.Changeset

  def get_project!(id) do
    id
    |> CouchService.get_document()
    |> case do
      {:ok, %{status: 200, body: body}} ->
        doc = Jason.decode!(body)

        Project.changeset(%Project{}, doc)
        |> apply_changes()
    end
  end

  def list_projects() do
    CouchService.run_find_query(%{selector: %{ doc_type: "project"}})
    |> case do
      {:ok, %{status: 200, body: body}} ->
        body
        |> Jason.decode!()
        |> then(fn(%{"docs" => docs}) ->
          docs
        end)
        |> Enum.map(fn(doc) ->
          Project.changeset(%Project{}, doc)
          |> apply_changes()
        end)
    end
  end

  def create_project(params) do
    %Project{}
    |> Project.changeset(params)
    |> apply_action(:create)
    |> case do
      {:error, _changeset} = error ->
        error
      {:ok, project} ->
        CouchService.put_document(project)
        |> case do
          {:ok, %{status: 201, body: body}} ->

            result = Jason.decode!(body)

            %Project{}
            |> Project.changeset(result)
            |> apply_changes()
        end
    end
  end

  def create_publication(%{"id" => id} = params, project_name) do

    CouchService.get_document(id)
    |> case do
      {:ok, %{status: 404}} ->
        %Publication{}
        |> Publication.changeset(params)
        |> apply_action(:create)
        |> case do
          {:error, _changeset} = error ->
            error
          {:ok, publication} ->
            publication
            |> CouchService.put_document()
            |> case do
              {:ok, %{status: 201}} ->
                project =
                  project_name
                  |> get_project!()

                project
                |> Project.changeset(%{
                  "publications" => Enum.uniq(project.publications ++ [publication.id])
                })
                |> apply_action!(:update)
                |> CouchService.put_document()
            end
        end
      {:ok, %{status: 200, body: body}} ->
        %{"_rev" => rev} = Jason.decode!(body)

        params = Map.put(params, "_rev", rev)

        %Publication{}
        |> Publication.changeset(params)
        |> apply_action(:create)
        |> case do
          {:error, _changeset} = error ->
            error
          {:ok, publication} ->
            publication
            |> CouchService.put_document()
            |> case do
              {:ok, %{status: 201}} ->
                project = get_project!(project_name)

                project
                |> Project.changeset(%{
                  "publications" => Enum.uniq(project.publications ++ [publication.id])
                })
                |> apply_action!(:update)
                |> CouchService.put_document()
            end
          end
    end
  end

  def update_project(%Project{} = project, params) do
    project
    |> Project.changeset(params)
    |> apply_action(:update)
    |> case do
      {:error, _changeset} = error ->
        error
      {:ok, project} ->
        CouchService.put_document(project)
        |> case do
          {:ok, %{status: 201, body: body}} ->
            new_rev =
              body
              |> Jason.decode!()
              |> Map.get("rev")

            {:ok, Map.put(project, :_rev, new_rev)}
        end
    end
  end

  def validate_doc_type(changeset, expected) do
    changeset
    |> Ecto.Changeset.fetch_field(:doc_type)
    |> case do
      {:data, ^expected} ->
        changeset
      {:data, type} ->
        changeset
        |> add_error(
          :doc_type,
          "expected 'doc_type' with value '#{expected}', got '#{type}'"
        )
      :error ->
        changeset
        |> add_error(
          :doc_type,
          "expected 'doc_type' with value '#{expected}'"
        )
    end
  end
end
