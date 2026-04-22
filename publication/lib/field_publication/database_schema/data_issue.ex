defmodule FieldPublication.DatabaseSchema.DataIssue do
  use Ecto.Schema

  import Ecto.Changeset

  alias FieldPublication.DatabaseSchema.LogEntry

  @derive Jason.Encoder
  @primary_key false
  embedded_schema do
    field(:issue_type_key, :string)
    field(:reported_by, :string)
    field(:uuid, :string)
    embeds_one(:log, LogEntry)
  end

  def changeset(issue, attrs \\ %{}) do
    issue
    |> cast(attrs, [:issue_type_key, :reported_by, :uuid])
    |> cast_embed(:log)
    |> validate_required([:issue_type_key, :reported_by])
  end

  def create!(key, reported_by, uuid, log) do
    changeset(%__MODULE__{}, %{
      issue_type_key: key,
      reported_by: reported_by,
      uuid: uuid,
      log: log
    })
    |> apply_action!(:create)
  end
end
