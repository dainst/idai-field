defmodule FieldPublication.Projects.Project do
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: false}
  embedded_schema do
    field :_rev, :string
    field :doc_type, :string, default: "project"
    field :visible, :boolean, default: false
    embeds_many :labels, FieldPublication.Translation, on_replace: :delete
    embeds_many :descriptions, FieldPublication.Translation, on_replace: :delete
  end

  @doc false
  def changeset(project, attrs) do
    project
    |> cast(attrs, [:id, :_rev, :visible])
    |> validate_required([:id])
    |> cast_embed(
      :labels,
      sort_param: :labels_sort,
      drop_param: :labels_drop,
      required: true
    )
    |> cast_embed(
      :descriptions,
      sort_param: :descriptions_sort,
      drop_param: :descriptions_drop,
      required: true
    )
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
    field :text, :string, primary_key: true
    field :language, :string, primary_key: true
  end

  def changeset(translation, attrs) do
    translation
    |> cast(attrs, [:text, :language])
    |> validate_required([:text, :language])
  end
end
