defmodule FieldPublication.DatabaseSchema.Project do
  use Ecto.Schema

  import Ecto.Changeset

  @doc_type "project"
  @primary_key false
  embedded_schema do
    field(:_id, :string)
    field(:_rev, :string)
    field(:identifier, :string, primary_key: true)
    field(:doc_type, :string, default: @doc_type)
    field(:editors, {:array, :string}, default: [])
  end

  @doc false
  def changeset(project, attrs \\ %{}) do
    project
    |> cast(attrs, [:identifier, :_rev, :editors])
    |> validate_required([:identifier])
    |> set_id()
  end

  def doc_type() do
    @doc_type
  end

  def set_id(changeset) do
    if identifier = get_field(changeset, :identifier) do
      put_change(changeset, :_id, id(identifier))
    else
      changeset
    end
  end

  def id(identifier) do
    Enum.join([@doc_type, identifier], "_")
  end
end

defimpl Phoenix.Param, for: FieldPublication.DatabaseSchema.Project do
  def to_param(%{identifier: identifier}) do
    identifier
  end
end
