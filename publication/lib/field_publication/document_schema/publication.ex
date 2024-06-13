defmodule FieldPublication.DocumentSchema.Publication do
  use Ecto.Schema

  import Ecto.Changeset

  alias FieldPublication.Projects

  alias FieldPublication.DocumentSchema.{
    Base,
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
    field(:drafted_by, :string)
    field(:replication_finished, :utc_datetime)
    field(:publication_date, :date)
    field(:configuration_doc, :string)
    field(:hierarchy_doc, :string)
    field(:database, :string)
    field(:languages, {:array, :string}, default: [])
    field(:version, Ecto.Enum, values: [:major, :revision], default: :major)
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
      :drafted_by,
      :draft_date,
      :replication_finished,
      :publication_date,
      :configuration_doc,
      :hierarchy_doc,
      :database,
      :languages,
      :version
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
      :hierarchy_doc,
      :database,
      :version
    ])
    |> ensure_project_exists()
    |> Base.validate_doc_type(@doc_type)
  end

  def doc_type() do
    @doc_type
  end

  defp ensure_project_exists(changeset) do
    name = get_field(changeset, :project_name)

    Projects.get(name)
    |> case do
      {:ok, _project} ->
        changeset

      {:error, :not_found} ->
        add_error(changeset, :project_name, "Project #{name} document not found.")
    end
  end
end
