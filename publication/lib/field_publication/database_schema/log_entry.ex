defmodule FieldPublication.DatabaseSchema.LogEntry do
  use Ecto.Schema

  import Ecto.Changeset

  @derive Jason.Encoder
  @primary_key false
  embedded_schema do
    field(:severity, Ecto.Enum, values: [:error, :warning, :info])

    field(:key, Ecto.Enum,
      values: [
        :replication_step,
        :malformed_geometry,
        :unknown_batch_error,
        :unknown_document_error
      ]
    )

    field(:message, :string)
    field(:timestamp, :utc_datetime)
    field(:metadata, :map, default: %{})
  end

  def changeset(entry, attrs \\ %{}) do
    entry
    |> cast(attrs, [:key, :severity, :timestamp, :message, :metadata])
    |> set_timestamp()
    |> validate_required([:key, :severity, :message, :timestamp])
  end

  def create(attrs) do
    changeset(%__MODULE__{}, attrs)
    |> apply_action(:create)
  end

  defp set_timestamp(changeset) do
    get_field(changeset, :timestamp)
    |> case do
      nil ->
        put_change(changeset, :timestamp, DateTime.utc_now())

      _ ->
        changeset
    end
  end
end
