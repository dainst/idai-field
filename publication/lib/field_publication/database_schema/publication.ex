defmodule FieldPublication.DatabaseSchema.Publication do
  use Ecto.Schema

  import Ecto.Changeset

  alias FieldPublication.Projects

  alias FieldPublication.DatabaseSchema.{
    Translation,
    LogEntry
  }

  @doc_type "publication"
  @primary_key false
  embedded_schema do
    field(:_id, :string)
    field(:_rev, :string)
    field(:doc_type, :string, default: @doc_type)
    field(:project_identifier, :string, primary_key: true)
    field(:source_url, :string)
    field(:source_project_identifier, :string)
    field(:draft_date, :date, primary_key: true)
    field(:drafted_by, :string)
    field(:replication_finished, :utc_datetime)
    field(:publication_date, :date)
    field(:configuration_doc, :string)
    field(:database, :string)
    field(:languages, {:array, :string}, default: [])
    # Version is currently not used, the default is saved. The idea is to maybe
    # allow revision releases that can be created to fix errors without adding
    # a new major version. These then could get communicated differently through
    # the web UI.
    field(:version, Ecto.Enum, values: [:major, :revision], default: :major)
    embeds_many(:comments, Translation, on_replace: :delete)
    embeds_many(:replication_logs, LogEntry, on_replace: :delete)
  end

  def changeset(%__MODULE__{} = publication, attrs \\ %{}) do
    publication
    |> cast(attrs, [
      :_rev,
      :project_identifier,
      :source_url,
      :source_project_identifier,
      :drafted_by,
      :draft_date,
      :replication_finished,
      :publication_date,
      :configuration_doc,
      :database,
      :languages,
      :version
    ])
    |> cast_embed(:comments,
      sort_param: :comments_sort,
      drop_param: :comments_drop
    )
    |> cast_embed(:replication_logs)
    |> Translation.language_unique_constraint(:comments)
    |> validate_required([
      :project_identifier,
      :source_url,
      :source_project_identifier,
      :draft_date,
      :configuration_doc,
      :database,
      :version
    ])
    |> ensure_project_exists()
    |> set_id()
  end

  def doc_type() do
    @doc_type
  end

  def id(project_identifier, draft_date) do
    Enum.join([@doc_type, project_identifier, draft_date], "_")
  end

  defp ensure_project_exists(changeset) do
    project_identifier = get_field(changeset, :project_identifier)

    Projects.get(project_identifier)
    |> case do
      {:ok, _project} ->
        changeset

      {:error, :not_found} ->
        add_error(
          changeset,
          :project_identifier,
          "Project #{project_identifier} document not found."
        )
    end
  end

  def set_id(changeset) do
    with project_identifier <- get_field(changeset, :project_identifier),
         %Date{} = draft_date <- get_field(changeset, :draft_date) do
      put_change(changeset, :_id, id(project_identifier, draft_date))
    else
      _something_else_already_invalid ->
        changeset
    end
  end
end
