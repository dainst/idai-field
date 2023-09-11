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
    field(:project_key, :string)
    field(:delete_existing_publication, :boolean, default: false)
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
      :project_key,
      :delete_existing_publication
    ])
    |> validate_required([
      :source_url,
      :source_project_name,
      :source_user,
      :source_password,
      :project_key
    ])
    |> validate_format(:source_url, ~r/^http(s)?:\/\/.*/, message: "Not a valid http(s) URL.")
    |> cast_embed(:comments)
  end

  def create(params) do
    changeset(%__MODULE__{}, params)
    |> apply_action(:create)
  end
end
