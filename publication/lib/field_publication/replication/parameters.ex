defmodule FieldPublication.Replication.Parameters do
  alias FieldPublication.Schema.Translation

  use Ecto.Schema
  import Ecto.Changeset

  @primary_key false
  embedded_schema do
    field(:source_url, :string)
    field(:source_project_name, :string)
    field(:source_user, :string)
    field(:source_password, :string, redact: true)
    field(:local_project_name, :string)
    field(:local_delete_existing, :boolean, default: false)
    embeds_many(:comments, Translation)
  end

  @doc false
  def changeset(parameters, attrs \\ %{}) do
    parameters
    |> cast(attrs, [
      :source_url,
      :source_project_name,
      :source_user,
      :source_password,
      :local_project_name,
      :local_delete_existing
    ])
    |> validate_required([
      :source_url,
      :source_project_name,
      :source_user,
      :source_password,
      :local_project_name
    ])
    |> validate_format(:source_url, ~r/^http(s)?:\/\/.*/, message: "Not a valid FieldHub.")
    |> cast_embed(:comments)
  end

  def create(params) do
    changeset(%__MODULE__{}, params)
    |> apply_action(:create)
  end
end
