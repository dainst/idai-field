defmodule FieldPublication.Publication.DataIssues do
  use Ecto.Schema

  import Ecto.Changeset

  alias FieldPublication.{
    CouchService,
    Publication
  }

  alias FieldPublication.DatabaseSchema.LogEntry

  @doc_type "issue"
  @primary_key false
  embedded_schema do
    field(:_id, :string)
    field(:_rev, :string)
    field(:doc_type, :string, default: @doc_type)
    field(:uuid, :string)
    embeds_many(:entries, LogEntry, on_replace: :delete)
  end

  defp changeset(project, attrs \\ %{}) do
    project
    |> cast(attrs, [:_rev, :uuid])
    |> cast_embed(:entries)
    |> validate_required([:uuid])
    |> set_id()
  end

  def set_id(changeset) do
    if uuid = get_field(changeset, :uuid) do
      put_change(changeset, :_id, id(uuid))
    else
      changeset
    end
  end

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

  def add_entry(uuid, %LogEntry{} = entry, %Publication{meta_database: database_name})
      when is_binary(uuid) do
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
        |> put_embed(
          :entries,
          get_embed(changeset, :entries) ++ [entry]
        )
        |> apply_action(:create)
        |> case do
          {:ok, updated_doc} ->
            CouchService.put_document(document_id, updated_doc, database_name)

          error ->
            error
        end
    end
  end

  def add_entries(entries, %Publication{meta_database: database_name}) do
    existing_list =
      Enum.map(entries, fn {uuid, _doc} -> id(uuid) end)
      |> CouchService.get_documents(database_name)
      |> then(fn {:ok, %{body: body}} ->
        %{"results" => doc_list} = Jason.decode!(body)

        Enum.map(doc_list, fn
          %{"docs" => [%{"ok" => unparsed_doc}]} ->
            %__MODULE__{}
            |> changeset(unparsed_doc)
            |> apply_action!(:create)

          _ ->
            :not_found
        end)
      end)
      |> Stream.reject(fn val -> val == :not_found end)
      |> Stream.map(fn %__MODULE__{uuid: uuid} = issue ->
        {uuid, issue}
      end)
      |> Enum.into(%{})

    Stream.map(entries, fn {uuid, %LogEntry{} = entry} when is_binary(uuid) ->
      case Map.get(existing_list, uuid) do
        %__MODULE__{} = issue_doc ->
          changeset = changeset(issue_doc)

          changeset
          |> put_embed(
            :entries,
            issue_doc.entries ++ [entry]
          )
          |> apply_action(:create)
          |> case do
            {:ok, updated_doc} ->
              updated_doc

            _error ->
              # TODO: Add warning/error?
              create!(uuid, entry)
          end

        nil ->
          create!(uuid, entry)
      end
    end)
    |> Stream.chunk_every(500)
    |> Enum.each(&CouchService.post_documents(&1, database_name))
  end

  def remove_entries(report_key, %Publication{meta_database: database_name}) do
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

  def list(
        %Publication{meta_database: database_name},
        selector \\ %{selector: %{doc_type: @doc_type}}
      ) do
    CouchService.get_document_stream(selector, database_name)
    |> Stream.map(fn doc ->
      %__MODULE__{}
      |> changeset(doc)
      |> apply_action!(:create)
    end)
    |> Enum.to_list()
  end

  def get_grouped_issues(%Publication{} = publication) do
    publication
    |> list()
    |> Enum.reduce(%{}, fn %__MODULE__{uuid: uuid, entries: entries} = _doc, acc ->
      Enum.reduce(entries, acc, fn %LogEntry{
                                     message: message,
                                     severity: severity,
                                     type: type,
                                     reported_by: reported_by
                                   },
                                   inner_acc ->
        Map.update(
          inner_acc,
          {type, severity},
          [%{uuid: uuid, message: message, reported_by: reported_by}],
          fn existing ->
            existing ++ [%{uuid: uuid, message: message, reported_by: reported_by}]
          end
        )
      end)
    end)
  end
end
