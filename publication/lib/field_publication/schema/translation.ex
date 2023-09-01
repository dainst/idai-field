defmodule FieldPublication.Schema.Translation do
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
