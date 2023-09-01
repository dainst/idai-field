defmodule FieldPublication.Documents.Publication do
  use Ecto.Schema
  import Ecto.Changeset

  alias FieldPublication.Documents

  @doc_type "publication"
  @primary_key {:id, :binary_id, autogenerate: false}
  embedded_schema do
    field :_rev, :string
    field :doc_type, :string, default: @doc_type
    field :status, Ecto.Enum, values: [:draft, :public], default: :draft
    field :source_url, :string
    field :source_project_name, :string
    field :draft_date, :utc_datetime
    field :publication_date, :utc_datetime
    field :configuration, {:array, :map}
  end

  def changeset(publication, attrs) do
    publication
    |> cast(attrs, [:id, :_rev, :status, :source_url, :source_project_name, :draft_date, :publication_date, :configuration])
    |> validate_required([:id, :status, :source_url, :source_project_name, :draft_date, :configuration])
    |> Documents.validate_doc_type(@doc_type)
  end
end
