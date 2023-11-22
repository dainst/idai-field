defmodule FieldPublication.Schemas.LogEntry do
  use Ecto.Schema

  import Ecto.Changeset

  @derive Jason.Encoder
  @primary_key false
  embedded_schema do
    field(:severity, Ecto.Enum, values: [:error, :warning, :info])
    field(:timestamp, :utc_datetime)
    field(:message, :string)
  end

  def changeset(entry, attrs \\ %{}) do
    entry
    |> cast(attrs, [:severity, :timestamp, :message])
    |> validate_required([:severity, :timestamp, :message])
  end

  def create(attrs) do
    changeset(%__MODULE__{}, attrs)
    |> apply_action(:create)
  end
end
