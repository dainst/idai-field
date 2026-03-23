defmodule FieldPublication.DatabaseSchema.User do
  use Ecto.Schema

  import Ecto.Changeset

  @primary_key false
  embedded_schema do
    field(:name, :string)
    field(:password, :string, redact: true)
    field(:label, :string)
  end

  @doc false
  def changeset(%__MODULE__{} = user, attrs \\ %{}, create? \\ false) do
    required_fields = [:name, :label] ++ if create?, do: [:password], else: []

    user
    |> cast(attrs, [:name, :password, :label])
    |> validate_required(required_fields)
  end
end
