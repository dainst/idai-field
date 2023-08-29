defmodule FieldPublication.Replication.Parameters do
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key false
  embedded_schema do
    field :source_url, :string
    field :source_project_name, :string
    field :source_user, :string
    field :source_password, :string
    field :local_project_name, :string
  end

  @doc false
  def changeset(parameters, attrs \\ %{}) do
    parameters
    |> cast(attrs, [:source_url, :source_project_name, :source_user, :source_password, :local_project_name])
    |> validate_required([:source_url, :source_project_name, :source_user, :source_password, :local_project_name])
    |> validate_format(:source_url, ~r/^http(s)?:\/\/.*/, message: "Not a valid FieldHub.")
  end

  def create(params) do # TODO: Move out of this module
    changeset(%FieldPublication.Replication.Parameters{}, params)
    |> apply_action(:create)
  end
end
