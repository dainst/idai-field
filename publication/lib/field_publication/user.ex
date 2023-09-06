defmodule FieldPublication.User do

  alias FieldPublication.CouchService

  @moduledoc """
  Bundles (CouchDB) user related functions.
  """

  @doc """
  Create a new user

  Returns `{:ok, :created}` if successful or `{:error, :already_exists}` a user of that name already exists.

  __Parameters__
  - `name` the user's name.
  - `password` the user's password.
  """
  def create(name, password) do
    CouchService.create_user(name, password)
    |> case do
      {:ok, %{status: 201}} ->
        {:ok, :created}

      {:ok, %{status: 409}} ->
        {:error, :already_exists}
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
  - `name` the user's name.
  - `password` the user's name.
  """
  def update_password(name, password) do
    CouchService.update_password(name, password)
    |> case do
      {:ok, %{status: 201}} ->
        {:ok, :updated}

      {:ok, %{status: 404}} ->
        {:error, :unknown}
    end
  end

  @doc """
  Check if a user is the admin.

  __Parameters__
  - `name` the user's name.
  """
  def is_admin?(name) do
    name == Application.get_env(:field_hub, :couchdb_admin_name)
  end
end
