defmodule FieldPublication.DatabaseSchema.DataHierarchy do
  use Ecto.Schema

  import Ecto.Changeset

  @doc_type "hierarchy"
  @primary_key false
  embedded_schema do
    field(:_rev, :string)
    field(:doc_type, :string, default: @doc_type)
    field(:uuid, :string)
    field(:parent_uuid, :string)
    field(:children_uuids, {:array, :string})
  end

  def id(%__MODULE__{uuid: uuid}), do: "hierarchy_#{uuid}"

  def create(uuid, parent_uuid, children) do
    %__MODULE__{}
    |> changeset(%{
      uuid: uuid,
      parent_uuid: parent_uuid,
      children_uuids: children
    })
    |> Ecto.Changeset.apply_action(:create)
  end

  def create!(uuid, parent_uuid, children) do
    {:ok, hierarchy_doc} = create(uuid, parent_uuid, children)

    hierarchy_doc
  end

  defp changeset(%__MODULE__{} = hierarchy, attrs) do
    hierarchy
    |> cast(attrs, [:_rev, :uuid, :parent_uuid, :children_uuids])
    |> validate_required([:uuid])
  end
end
