defmodule FieldPublication.Publication.DocumentPreview do
  use Ecto.Schema

  import Ecto.Changeset

  alias FieldPublication.{
    CouchService,
    Publication
  }

  alias FieldPublication.Publication.{
    Configuration,
    Document,
    DataIssues
  }

  alias FieldPublication.DatabaseSchema.LogEntry

  require Logger

  @report_key "preview"
  def report_key(), do: @report_key

  @doc_type "preview"
  @primary_key false
  embedded_schema do
    field(:_id, :string)
    field(:_rev, :string)
    field(:doc_type, :string, default: @doc_type)
    field(:uuid, :string)
    field(:preview, :map)
  end

  defp changeset(%__MODULE__{} = preview, attrs) do
    preview
    |> cast(attrs, [:_rev, :uuid, :preview])
    |> validate_required([:uuid, :preview])
    |> set_id()
  end

  def set_id(changeset) do
    if uuid = get_field(changeset, :uuid) do
      put_change(changeset, :_id, id(uuid))
    else
      changeset
    end
  end

  def create(%Document{} = doc) do
    %__MODULE__{}
    |> changeset(%{
      uuid: doc.id,
      preview: %{doc | groups: [], relations: [], geometry: []}
    })
    |> apply_action(:create)
  end

  def create!(%Document{} = doc) do
    {:ok, preview} = create(doc)
    preview
  end

  def id(uuid) when is_binary(uuid), do: "preview_#{uuid}"

  def list(%Publication{meta_database: db_name}, nil) do
    %{selector: %{doc_type: "preview"}}
    |> CouchService.get_document_stream(db_name)
    |> Stream.map(fn %{"preview" => preview} ->
      preview
    end)
    |> Enum.map(&Document.from_map/1)
  end

  def list(%Publication{meta_database: db_name}, uuids) when is_list(uuids) do
    uuids
    |> Enum.map(&id/1)
    |> CouchService.get_documents(db_name)
    |> case do
      {:ok, %{status: 200, body: body}} ->
        Jason.decode!(body)
        |> Map.get("results", [])
        |> Stream.map(fn
          %{"docs" => [%{"ok" => %{"preview" => doc}}]} ->
            doc

          _ ->
            nil
        end)
        |> Stream.reject(&is_nil/1)
        |> Enum.map(&Document.from_map/1)

      _ ->
        []
    end
  end

  def recreate_previews(
        %Publication{} = publication
      ) do
    clear_all(publication)
    create_all(publication)
  end

  defp clear_all(%Publication{meta_database: meta_db_name}) do
    CouchService.get_document_stream(
      %{
        selector: %{
          "$or": [
            %{doc_type: "preview"},
            %{entries: %{"$elemMatch": %{reported_by: @report_key}}}
          ]
        }
      },
      meta_db_name
    )
    |> Stream.map(fn doc ->
      %{
        "_id" => doc["_id"],
        "_rev" => doc["_rev"],
        "_deleted" => true
      }
    end)
    |> Stream.chunk_every(10000)
    |> Enum.each(fn doc_list ->
      CouchService.post_documents(doc_list, meta_db_name)
    end)
  end

  defp create_all(
         %Publication{_id: pub_id, database: raw_db, meta_database: meta_db_name} = publication
       ) do
    config = Configuration.get(publication)

    CouchService.get_document_stream(%{selector: %{}}, raw_db)
    |> Stream.reject(fn
      %{"resource" => %{"category" => "Configuration"}} ->
        true

      %{"resource" => _} ->
        false

      other ->
        DataIssues.add_entry(
          other["_id"],
          LogEntry.create(%{
            type: "invalid_document",
            reported_by: @report_key,
            severity: :error,
            message: "Invalid document for preview creation."
          }),
          publication
        )

        true
    end)
    |> Stream.map(fn raw_doc ->
      {raw_doc, Configuration.apply_project_configuration(raw_doc, config, publication)}
    end)
    |> Stream.filter(fn
      {_raw_doc, %Document{} = _full} ->
        true

      {raw_doc, error} ->
        Logger.warning(
          "Failed to apply project configuration to `#{raw_doc["_id"]}` (`#{pub_id}`)"
        )

        Logger.warning(inspect(error))

        DataIssues.add_entry(
          raw_doc["_id"],
          LogEntry.create(%{
            type: "invalid_document",
            reported_by: @report_key,
            severity: :error,
            message: inspect(error)
          }),
          publication
        )

        false
    end)
    |> Stream.map(fn {_raw_doc, %Document{} = doc} ->
      # Remove groups and relations from doc
      create(doc)
    end)
    |> Stream.filter(fn
      {:ok, _doc} ->
        true

      {:error, changeset} ->
        Logger.error("Failed to create preview document:")
        Logger.error(inspect(changeset))
        false
    end)
    |> Stream.map(fn {:ok, doc} -> doc end)
    |> Stream.chunk_every(2000)
    |> Enum.map(fn payload ->
      CouchService.post_documents(payload, meta_db_name)
    end)
  end
end
