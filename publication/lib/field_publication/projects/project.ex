defmodule FieldPublication.Projects.Project do
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: false}
  embedded_schema do
    field :_rev, :string
    field :doc_type, :string, default: "project"
    field :visible, :boolean, default: false
    field :editors, {:array, :string}, default: []
    embeds_many :names, FieldPublication.Translation
    embeds_many :descriptions, FieldPublication.Translation
  end

  @doc false
  def changeset(project, attrs) do
    project
    |> cast(attrs, [:id, :_rev, :visible, :editors])
    |> validate_required([:id])
  end

  def create(params) do
    changeset(%FieldPublication.Projects.Project{}, params)
    |> apply_action(:create)
  end

  def update(project, params) do
    changeset(project, params)
    |> apply_action(:update)
  end
end

defmodule FieldPublication.Translation do
  use Ecto.Schema
  import Ecto.Changeset

  @derive Jason.Encoder
  @primary_key false
  embedded_schema do
    field :text, :string
    field :language, :string
  end

  def changeset(translation, attrs) do
    translation
    |> cast(attrs, [:text, :language])
    |> validate_required([:text, :language])
  end
end