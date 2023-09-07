defmodule FieldPublication.Schema.Project do
  use Ecto.Schema

  import Ecto.Changeset

  alias FieldPublication.CouchService
  alias FieldPublication.FileService
  alias FieldPublication.Schema.Publication
  alias FieldPublication.User

  @doc_type "project"
  @primary_key {:id, :binary_id, autogenerate: false}
  embedded_schema do
    field :_rev, :string
    field :doc_type, :string, default: @doc_type
    field :hidden, :boolean, default: true
    field :editors, {:array, :string}, default: []
    embeds_many :publications, Publication
  end

  @doc false
  def changeset(project, attrs \\ %{}) do
    project
    |> cast(attrs, [:id, :_rev, :hidden, :editors])
    |> cast_embed(:publications)
    |> validate_required([:id])
    |> FieldPublication.Schema.validate_doc_type(@doc_type)
  end

  def get_project!(id) do
    id
    |> CouchService.get_document()
    |> case do
      {:ok, %{status: 200, body: body}} ->
        doc = Jason.decode!(body)

        changeset(%__MODULE__{}, doc)
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
          changeset(%__MODULE__{}, doc)
          |> apply_changes()
        end)
    end
  end

  def create_project(params) do
    %__MODULE__{}
    |> changeset(params)
    |> apply_action(:create)
    |> case do
      {:error, _changeset} = error ->
        error
      {:ok, project} ->
        CouchService.put_document(project)
        |> case do
          {:ok, %{status: 201, body: body}} ->

            result = Jason.decode!(body)
            {
              :ok,
              %__MODULE__{}
              |> changeset(result)
              |> apply_changes()
            }
        end
    end
  end

  def update_project(%__MODULE__{} = old_project, update_params \\ %{}) do
    old_project
    |> changeset(update_params)
    |> apply_action(:update)
    |> case do
      {:error, _changeset} = error ->
        error
      {:ok, updated_project} ->
        CouchService.put_document(updated_project)
        |> case do
          {:ok, %{status: 201, body: body}} ->
            new_rev =
              body
              |> Jason.decode!()
              |> Map.get("rev")

            updated_project.publications
            |> Enum.map(fn(%Publication{} = publication) ->
              CouchService.update_database_members(publication.database, updated_project.editors)
            end)

            # Update the CouchDB document revision that changed with the successful `CouchService.put_document/1` above.
            {:ok, Map.put(updated_project, :_rev, new_rev)}
        end
    end
  end

  def delete_project(%__MODULE__{id: id, _rev: rev}) do
    CouchService.delete_document(id, rev)
    |> case do
      {:ok, %{status: 200}} ->
        {:ok, :deleted}
    end
  end

  def add_publication(%__MODULE__{} = project, %Publication{} = new_publication) do
    filtered =
      project.publications
      |> Enum.reject(fn(%Publication{} = existing) ->
        existing.draft_date == new_publication.draft_date
      end)

    updated =
      filtered ++ [new_publication]
      |> Enum.sort(fn(a, b) -> a.draft_date > b.draft_date end)

    Map.replace(project, :publications, updated)
    |> update_project()
  end

  def remove_publication(%__MODULE__{} = project, %Publication{} = removed_publication) do
    filtered =
      project.publications
      |> Enum.reject(fn(%Publication{} = existing) ->
        existing.draft_date == removed_publication.draft_date
      end)

    removed_publication.database
    |> CouchService.delete_database()

    removed_publication.configuration_doc
    |> CouchService.get_document()
    |> then(fn({:ok, %{status: 200, body: body}}) -> Jason.decode!(body) end)
    |> then(fn(%{"_id" => id, "_rev" => rev}) ->
      CouchService.delete_document(id, rev)
    end)

    FileService.delete_publication("#{project.id}_publication_#{removed_publication.draft_date}")

    Map.replace(project, :publications, filtered)
    |> update_project()
  end

  def has_project_access?(_project_name, nil) do
    false
  end

  def has_project_access?(project_name, user_name) do
    if User.is_admin?(user_name) do
      true
    else
      project = get_project!(project_name)
      user_name in project.editors
    end
  end
end
