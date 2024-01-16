defmodule FieldPublication.Schemas.ReplicationInput do
  alias FieldPublication.Schemas.Translation

  use Ecto.Schema
  import Ecto.Changeset

  @primary_key false
  embedded_schema do
    field(:source_url, :string)
    field(:source_project_name, :string)
    field(:source_user, :string)
    field(:source_password, :string, redact: true)
    field(:project_name, :string)
    field(:delete_existing_publication, :boolean, default: false)
    field(:processing, :boolean, default: true)
    embeds_many(:comments, Translation)
  end

  @doc false
  def changeset(input_struct, attrs \\ %{}) do
    input_struct
    |> cast(attrs, [
      :source_url,
      :source_project_name,
      :source_user,
      :source_password,
      :project_name,
      :delete_existing_publication,
      :processing
    ])
    |> validate_required([
      :source_url,
      :source_project_name,
      :source_user,
      :source_password,
      :project_name
    ])
    |> validate_format(:source_url, ~r/^http(s)?:\/\/.*/, message: "Not a valid http(s) URL.")
    |> cast_embed(:comments)
  end

  def create(params) do
    changeset(%__MODULE__{}, params)
    |> apply_action(:create)
  end

  def get_connection_error_changeset(%__MODULE__{} = replication_input, error) do
    replication_input
    |> changeset(%{})
    |> add_connection_error(error)
    |> apply_action(:update)
  end

  defp add_connection_error(changeset, 401) do
    changeset
    |> add_error(:source_user, "Failed to authenticate with provided credentials.")
    |> add_error(:source_password, "Failed to authenticate with provided credentials.")
  end

  defp add_connection_error(changeset, 403) do
    add_error(changeset, :source_user, "User not authorized to access source project.")
  end

  defp add_connection_error(changeset, 404) do
    changeset
    |> add_error(:source_url, "Specified source not found, wrong URL?")
    |> add_error(
      :source_project_name,
      "Specified source not found, wrong project name?"
    )
  end

  defp add_connection_error(changeset, :nxdomain) do
    add_error(changeset, :source_url, "Could not resolve provided source domain.")
  end

  defp add_connection_error(changeset, :econnrefused) do
    add_error(changeset, :source_url, "Connection refused by provided source")
  end
end
