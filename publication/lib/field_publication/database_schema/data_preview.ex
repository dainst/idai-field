defmodule FieldPublication.DatabaseSchema.DataPreview do
  use Ecto.Schema

  import Ecto.Changeset

  alias FieldPublication.DatabaseSchema.Base

  @doc_type "preview"
  @primary_key false
  embedded_schema do
    field(:_rev, :string)
    field(:doc_type, :string, default: @doc_type)
    field(:uuid, :string, primary_key: true)
    field(:preview, :map)
  end

  @doc false
  def changeset(project, attrs \\ %{}) do
    project
    |> cast(attrs, [:_rev, :uuid, :preview])
    |> validate_required([:uuid, :preview])
    |> Base.validate_doc_type(@doc_type)
  end

  def doc_type() do
    @doc_type
  end
end
