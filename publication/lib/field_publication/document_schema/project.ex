defmodule FieldPublication.DocumentSchema.Project do
  use Ecto.Schema

  import Ecto.Changeset

  alias FieldPublication.DocumentSchema.Base

  @doc_type "project"
  @primary_key false
  embedded_schema do
    field(:_rev, :string)
    field(:name, :string, primary_key: true)
    field(:doc_type, :string, default: @doc_type)
    field(:editors, {:array, :string}, default: [])
  end

  @doc false
  def changeset(project, attrs \\ %{}) do
    project
    |> cast(attrs, [:name, :_rev, :editors])
    |> validate_required([:name])
    |> Base.validate_doc_type(@doc_type)
  end

  def doc_type() do
    @doc_type
  end
end

defimpl Phoenix.Param, for: FieldPublication.DocumentSchema.Project do
  def to_param(%{name: name}) do
    name
  end
end
