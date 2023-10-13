defmodule FieldPublication.Schemas.Publication do
  use Ecto.Schema

  import Ecto.Changeset

  alias FieldPublication.Projects
  alias FieldPublication.Schemas

  alias FieldPublication.Schemas.{
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
    field(:replication_finished, :utc_datetime)
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
      :replication_finished,
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

  def doc_type() do
    @doc_type
  end

  defp validate_project_exists(changeset) do
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
