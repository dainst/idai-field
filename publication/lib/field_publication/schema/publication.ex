defmodule FieldPublication.Schema.Publication do
  use Ecto.Schema

  import Ecto.Changeset

  alias FieldPublication.Schema.Translation

  @derive Jason.Encoder
  @primary_key {:draft_date, :date, autogenerate: false}
  embedded_schema do
    field :source_url, :string
    field :source_project_name, :string
    field :publication_date, :date
    field :configuration_doc, :string
    field :database, :string
    embeds_many :comments, Translation
  end

  def changeset(publication, attrs \\ %{}) do
    publication
    |> cast(attrs, [:source_url, :source_project_name, :draft_date, :publication_date, :configuration_doc, :database])
    |> cast_embed(:comments)
    |> validate_required([:source_url, :source_project_name, :draft_date, :configuration_doc, :database])
  end
end
