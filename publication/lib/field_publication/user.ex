defmodule FieldPublication.User do
  use Ecto.Schema
  import Ecto.Changeset

  alias FieldPublication.CouchService

  @moduledoc """
  This module defines the primary `User` struct as an embedded Ecto schema and its related functions for
  creating, updating and deleting users in CouchDB.
  """
  @primary_key false
  embedded_schema do
    field(:name, :string)
    field(:password, :string, redact: true)
    field(:label, :string)
  end

  def changeset(%__MODULE__{name: existing_name} = user, attrs \\ %{}, create? \\ false) do
    required_fields = [:name, :label] ++ if create?, do: [:password], else: []

    user
    |> cast(attrs, [:name, :password, :label])
    |> validate_required(required_fields)
    |> prevent_name_change(existing_name)
  end

  defp prevent_name_change(changeset, nil) do
    changeset
  end

  defp prevent_name_change(changeset, existing_name) do
    if get_field(changeset, :name) != existing_name do
      add_error(changeset, :name, "Can not be changed after creation.")
    else
      changeset
    end
  end

  @doc """
  Get `%User{}` from the database by `name`.

  Returns `{:ok, %User{}}` on success, `{:error, :not_found}` otherwise.
  """
  def get(name) when is_binary(name) do
    CouchService.get_user(name)
    |> case do
      {:ok, %{status: 200, body: body}} ->
        params = Jason.decode!(body)

        %__MODULE__{}
        |> changeset(params)
        |> apply_action(:create)

      {:ok, %{status: 404}} = _response ->
        {:error, :not_found}
    end
  end

  @doc """
  Creates a new user.

  Returns `{:ok, %User{}}` on success, `{:error, changeset}` otherwise.

  ## Parameters
  - `params` map with containing `name`, `password` and `label`. The map will get validated
  via `User.changeset/2`.
  """
  def create(params) when is_map(params) do
    %__MODULE__{}
    |> changeset(params, true)
    |> apply_action(:create)
    |> case do
      {:error, _changeset} = error ->
        error

      {:ok, %__MODULE__{name: name} = user} ->
        CouchService.create_user(user)
        |> case do
          {:ok, %{status: 201}} ->
            {:ok, user}

          {:ok, %{status: 409}} ->
            user
            |> changeset()
            |> Ecto.Changeset.add_error(:name, "name '#{name}' already taken.")
            |> Ecto.Changeset.apply_action(:validate)
        end
    end
  end

  @doc """
  Deletes a user.

  Returns `{:ok, :deleted}` if successful or `{:error, :not_found}` if user is unknown.

  ## Parameters
  - `name` the user's name.
  """
  def delete(name) do
    CouchService.delete_user(name)
    |> case do
      {:ok, %{status: 200}} ->
        {:ok, :deleted}

      {:ok, %{status: 404}} ->
        {:error, :not_found}
    end
  end

  @doc """
  Update a user's password

  Returns `{:ok, :updated}` if successful or `{:error, :unknown}` if user is unknown.

  ## Parameters
  - `user` the current `%User{}` struct that is supposed to get updated.
  - `params` map with containing `password` or `label`. The map will get validated
  via `User.changeset/2`.
  """
  def update(user, params) do
    user
    |> changeset(params)
    |> apply_action(:update)
    |> case do
      {:error, _changeset} = error ->
        error

      {:ok, user} ->
        CouchService.update_user(user)
        |> case do
          {:ok, %{status: 201}} ->
            {:ok, user}

          {:ok, %{status: 404}} ->
            {
              :error,
              user
              |> changeset()
              |> Ecto.Changeset.add_error(:name, "name not found.")
            }
        end
    end
  end

  @doc """
  Check if a user is the admin.

  ## Parameters
  - `name` the user's name.
  """
  def is_admin?(name) do
    name == Application.get_env(:field_publication, :couchdb_admin_name)
  end

  @doc """
  Returns a list of all available users (excluding the main CouchDB administrator).
  """
  def list() do
    CouchService.list_users()
    |> case do
      {:ok, %{status: 200, body: body}} ->
        body
        |> Jason.decode!()
        |> Map.get("rows", [])
        |> Enum.filter(fn doc -> String.starts_with?(doc["id"], "org.couchdb.user:") end)
        |> Enum.map(fn %{"doc" => doc} ->
          changeset(%__MODULE__{}, doc)
          |> apply_action!(:create)
        end)
    end
  end
end
