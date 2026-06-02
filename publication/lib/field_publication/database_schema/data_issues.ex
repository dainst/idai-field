defmodule FieldPublication.DatabaseSchema.DataIssues do
  use Ecto.Schema

  import Ecto.Changeset

  alias FieldPublication.DatabaseSchema.Base
  alias FieldPublication.DatabaseSchema.LogEntry

  @doc_type "issue"
  @primary_key false
  embedded_schema do
    field(:_rev, :string)
    field(:doc_type, :string, default: @doc_type)
    field(:uuid, :string, primary_key: true)
    embeds_many(:entries, LogEntry)
  end

  @doc false
  def changeset(project, attrs \\ %{}) do
    project
    |> cast(attrs, [:_rev, :uuid])
    |> cast_embed(:entries)
    |> validate_required([:uuid])
    |> Base.validate_doc_type(@doc_type)
  end

  def doc_type() do
    @doc_type
  end

  def get_document_id(uuid) do
    "issue_#{uuid}"
  end
end
