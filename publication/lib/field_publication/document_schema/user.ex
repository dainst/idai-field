defmodule FieldPublication.DocumentSchema.User do
  use Ecto.Schema

  import Ecto.Changeset

  @derive Jason.Encoder
  @primary_key {:name, :string, autogenerate: false}
  embedded_schema do
    field(:_rev, :string)
    field(:user_name, :string, primary_key: true)
    field(:user_password, :string, redact: true)
  end

  @doc false
  def changeset(%__MODULE__{} = user, attrs \\ %{}) do
    user
    |> cast(attrs, [:_rev, :user_name, :user_password])
    |> validate_required([:user_name, :user_password])
  end
end
