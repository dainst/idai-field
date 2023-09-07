defmodule FieldPublication.Replication.Parameters do
  alias FieldPublication.Schema.Translation

  use Ecto.Schema
  import Ecto.Changeset

  @primary_key false
  embedded_schema do
    field :source_url, :string
    field :source_project_name, :string
    field :source_user, :string
    field :source_password, :string, redact: true
    field :local_project_name, :string
    field :local_delete_existing, :boolean, default: false
    embeds_many :comments, Translation
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

  def set_source_connection_error(changeset, %Mint.TransportError{reason: :nxdomain}) do
    changeset
    |> add_error(:source_url, "domain not nound")
    |> Map.put(:action, :insert)
  end

  def set_source_connection_error(changeset, %Mint.TransportError{reason: :econnrefused}) do
    changeset
    |> add_error(:source_url, "connection refused")
    |> Map.put(:action, :insert)
  end

  def set_invalid_credentials(changeset) do
    changeset
    |> add_error(:source_project_name, "invalid credentials")
    |> add_error(:source_user, "invalid credentials")
    |> add_error(:source_password, "invalid credentials")
    |> Map.put(:action, :insert)
  end

  def create(params) do # TODO: Move out of this module
    changeset(%FieldPublication.Replication.Parameters{}, params)
    |> apply_action(:create)
  end
end
