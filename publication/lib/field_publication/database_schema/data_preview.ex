defmodule FieldPublication.DatabaseSchema.DataPreview do
  use Ecto.Schema

  import Ecto.Changeset

  alias FieldPublication.Publications.Data.Document

  @doc_type "preview"
  @primary_key false
  embedded_schema do
    field(:_rev, :string)
    field(:doc_type, :string, default: @doc_type)
    field(:uuid, :string)
    field(:preview, :map)
  end

  def create(%Document{} = doc) do
    %__MODULE__{}
    |> changeset(%{
      uuid: doc.id,
      preview: %{doc | groups: [], relations: []}
    })
    |> apply_action(:create)
  end

  def create!(%Document{} = doc) do
    {:ok, preview} = create(doc)
    preview
  end

  def id(%__MODULE__{uuid: uuid}), do: "preview_#{uuid}"

  defp changeset(%__MODULE__{} = preview, attrs) do
    preview
    |> cast(attrs, [:_rev, :uuid, :preview])
    |> validate_required([:uuid, :preview])
  end
end
