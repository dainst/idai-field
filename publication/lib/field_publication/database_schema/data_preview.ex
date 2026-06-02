defmodule FieldPublication.DatabaseSchema.DataPreview do
  use Ecto.Schema

  import Ecto.Changeset

  alias FieldPublication.CouchService
  alias FieldPublication.Publications.Data
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

  def list(db_name, uuids \\ nil)

  def list(db_name, nil) when is_binary(db_name) do
    %{selector: %{doc_type: "preview"}}
    |> CouchService.get_document_stream(db_name)
    |> Stream.map(fn %{"preview" => preview} ->
      preview
    end)
    |> Enum.map(&Data.document_map_to_struct/1)
  end

  def list(db_name, uuids) when is_binary(db_name) and is_list(uuids) do
    Enum.map(uuids, fn uuid ->
      %{selector: %{doc_type: "preview", uuid: uuid}}
    end)
    |> Task.async_stream(fn selector ->
      CouchService.get_document_stream(selector, db_name)
      |> Enum.map(fn %{"preview" => preview} ->
        preview
      end)
      |> Enum.map(&Data.document_map_to_struct/1)
    end)
    |> Enum.reject(fn {:ok, result} -> result == [] end)
    |> Enum.map(fn
      {:ok, [doc]} -> doc
    end)
  end

  defp changeset(%__MODULE__{} = preview, attrs) do
    preview
    |> cast(attrs, [:_rev, :uuid, :preview])
    |> validate_required([:uuid, :preview])
  end
end
