defmodule FieldPublication.Schema.Publication do
  use Ecto.Schema

  import Ecto.Changeset

  alias FieldPublication.Schema.Translation

  @derive Jason.Encoder
  @primary_key {:database, :string, autogenerate: false}
  embedded_schema do
    field :status, Ecto.Enum, values: [:draft, :public], default: :draft
    field :source_url, :string
    field :source_project_name, :string
    field :draft_date, :date
    field :publication_date, :date
    field :configuration_doc, :string
    embeds_many :comments, Translation
  end

  def changeset(publication, attrs \\ %{}) do
    publication
    |> cast(attrs, [:status, :source_url, :source_project_name, :draft_date, :publication_date, :configuration_doc, :database])
    |> cast_embed(:comments)
    |> validate_required([:status, :source_url, :source_project_name, :draft_date, :configuration_doc, :database])
  end
end
