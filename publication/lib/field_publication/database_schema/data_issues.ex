defmodule FieldPublication.DatabaseSchema.DataIssues do
  use Ecto.Schema

  import Ecto.Changeset

  alias FieldPublication.CouchService
  alias FieldPublication.DatabaseSchema.LogEntry

  @doc_type "issue"
  @primary_key false
  embedded_schema do
    field(:_rev, :string)
    field(:doc_type, :string, default: @doc_type)
    field(:uuid, :string)
    embeds_many(:entries, LogEntry)
  end

  def id(%__MODULE__{uuid: uuid}), do: "issue_#{uuid}"
  def id(uuid) when is_binary(uuid), do: "issue_#{uuid}"

  def create(uuid, %LogEntry{} = entry) when is_binary(uuid) do
    %__MODULE__{}
    |> changeset(%{
      uuid: uuid
    })
    |> put_embed(:entries, [entry])
    |> apply_action(:create)
  end

  def create!(uuid, %LogEntry{} = entry) do
    {:ok, issues_doc} = create(uuid, entry)

    issues_doc
  end

  def add_entry(uuid, %LogEntry{} = entry, database_name)
      when is_binary(uuid) and is_binary(database_name) do
    document_id = id(uuid)

    CouchService.get_document(document_id, database_name)
    |> case do
      {:ok, %{status: 404}} ->
        CouchService.put_document(
          document_id,
          create!(uuid, entry),
          database_name
        )

      {:ok, %{status: 200, body: body}} ->
        changeset = changeset(%__MODULE__{}, Jason.decode!(body))

        changeset
        |> Ecto.Changeset.put_embed(
          :entries,
          Ecto.Changeset.get_embed(changeset, :entries) ++ [entry]
        )
        |> Ecto.Changeset.apply_action(:create)
        |> case do
          {:ok, updated_doc} ->
            CouchService.put_document(document_id, updated_doc, database_name)

          error ->
            error
        end
    end
  end

  def remove_entries(report_key, database_name) do
    CouchService.get_document_stream(
      %{
        selector: %{entries: %{"$elemMatch": %{reported_by: report_key}}}
      },
      database_name
    )
    |> Stream.map(fn doc ->
      Map.update!(doc, "entries", fn existing ->
        Enum.reject(existing, fn %{"reported_by" => r} -> r == report_key end)
      end)
    end)
    |> Stream.chunk_every(10000)
    |> Enum.each(fn doc_list ->
      CouchService.post_documents(doc_list, database_name)
    end)
  end

  def list(database_name) do
    CouchService.get_document_stream(%{selector: %{doc_type: @doc_type}}, database_name)
    |> Stream.map(fn doc ->
      %__MODULE__{}
      |> changeset(doc)
      |> apply_action!(:create)
    end)
    |> Enum.to_list()
  end

  defp changeset(project, attrs) do
    project
    |> cast(attrs, [:_rev, :uuid])
    |> cast_embed(:entries)
    |> validate_required([:uuid])
  end
end
