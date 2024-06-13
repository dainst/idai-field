defmodule FieldPublication.Users do
  import Ecto.Changeset

  alias FieldPublication.CouchService
  alias FieldPublication.DocumentSchema.User

  @moduledoc """
  Bundles (CouchDB) user related functions.
  """

  @doc """

  """
  def get(name) do
    CouchService.get_user(name)
    |> case do
      {:ok, %{status: 200, body: body}} ->
        params =
          body
          |> Jason.decode!()

        {
          :ok,
          %User{}
          |> User.changeset(params)
          |> apply_action!(:create)
        }

      {:ok, %{status: 404}} = _response ->
        {:error, :not_found}
    end
  end

  @doc """
  Create a new user

  Returns `{:ok, :created}` if successful or `{:error, :already_exists}` a user of that name already exists.

  __Parameters__
  - `user_name` the user's name.
  - `user_password` the user's password.
  """
  def create(params) do
    %User{}
    |> User.changeset(params)
    |> validate_required([:password])
    |> apply_action(:create)
    |> case do
      {:error, _changeset} = error ->
        error

      {:ok, %User{name: name} = user} ->
        CouchService.create_user(user)
        |> case do
          {:ok, %{status: 201}} ->
            {:ok, user}

          {:ok, %{status: 409}} ->
            {
              :error,
              user
              |> User.changeset()
              |> Ecto.Changeset.add_error(:name, "name '#{name}' already taken.")
              |> Ecto.Changeset.apply_action(:validate)
            }
        end
    end
  end

  @doc """
  Delete a user

  Returns `{:ok, :deleted}` if successful or `{:error, :unknown}` if user is unknown.

  __Parameters__
  - `name` the user's name.
  """
  def delete(name) do
    CouchService.delete_user(name)
    |> case do
      {:ok, %{status: 200}} ->
        {:ok, :deleted}

      {:ok, %{status: 404}} ->
        {:error, :unknown}
    end
  end

  @doc """
  Update a user's password

  Returns `{:ok, :updated}` if successful or `{:error, :unknown}` if user is unknown.

  __Parameters__
  - `user_name` the user's name.
  - `user_password` the user's name.
  """
  def update(user, params) do
    user
    |> User.changeset(params)
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
              |> User.changeset()
              |> Ecto.Changeset.add_error(:name, "name not found.")
            }
        end
    end
  end

  @doc """
  Check if a user is the admin.

  __Parameters__
  - `name` the user's name.
  """
  def is_admin?(name) do
    name == Application.get_env(:field_publication, :couchdb_admin_name)
  end

  def list() do
    CouchService.list_users()
    |> case do
      {:ok, %{status: 200, body: body}} ->
        body
        |> Jason.decode!()
        |> Map.get("rows", [])
        |> Enum.filter(fn doc -> String.starts_with?(doc["id"], "org.couchdb.user:") end)
        |> Enum.map(fn %{"doc" => doc} ->
          User.changeset(%User{}, doc)
          |> apply_action!(:create)
        end)
    end
  end
end
