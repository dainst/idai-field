
defmodule FieldPublication.Documents.Project do
  use Ecto.Schema
  import Ecto.Changeset

  alias FieldPublication.Documents

  @doc_type "project"
  @primary_key {:id, :binary_id, autogenerate: false}
  embedded_schema do
    field :_rev, :string
    field :doc_type, :string, default: @doc_type
    field :hidden, :boolean, default: true
    field :publications, {:array, :string}, default: []
  end

  @doc false
  def changeset(project, attrs \\ %{}) do
    project
    |> cast(attrs, [:id, :_rev, :hidden, :publications])
    |> validate_required([:id])
    |> Documents.validate_doc_type(@doc_type)
  end
end

# defmodule FieldPublication.Translation do
#   use Ecto.Schema
#   import Ecto.Changeset

#   @derive Jason.Encoder
#   @primary_key false
#   embedded_schema do
#     field :text, :string, primary_key: true
#     field :language, :string, primary_key: true
#   end

#   def changeset(translation, attrs) do
#     translation
#     |> cast(attrs, [:text, :language])
#     |> validate_required([:text, :language])
#   end
# end
# end
