defmodule FieldPublication.DatabaseSchema.DataHierarchy do
  use Ecto.Schema

  import Ecto.Changeset

  alias FieldPublication.DatabaseSchema.Base

  @doc_type "hierarchy"
  @primary_key false
  embedded_schema do
    field(:_rev, :string)
    field(:doc_type, :string, default: @doc_type)
    field(:uuid, :string, primary_key: true)
    field(:parent_uuid, :string)
    field(:children_uuids, {:array, :string})
  end

  @doc false
  def changeset(project, attrs \\ %{}) do
    project
    |> cast(attrs, [:_rev, :uuid, :parent_uuid, :children_uuids])
    |> validate_required([:uuid])
    |> Base.validate_doc_type(@doc_type)
  end

  def doc_type() do
    @doc_type
  end
end
