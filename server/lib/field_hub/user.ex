defmodule FieldHub.User do
  alias FieldHub.{
    CouchService
  }

  @moduledoc """
  Bundles (CouchDB) user related functions.
  """

  @doc """
  Create a new user

  Returns `:created` if successful or `:already_exists` a user of that name already exists.

  __Parameters__
  - `name` the user's name.
  - `password` the user's password.
  """
  def create(name, password) do
    %{status_code: status_code} = CouchService.create_user(name, password)

    case status_code do
      201 ->
        :created

      409 ->
        :already_exists
    end
  end

  @doc """
  Delete a user

  Returns `:deleted` if successful or `:unknown` if user is unknown.

  __Parameters__
  - `name` the user's name.
  """
  def delete(name) do
    CouchService.delete_user(name)
    |> case do
      %{status_code: 200} ->
        :deleted

      %{status_code: 404} ->
        :unknown
    end
  end

  @doc """
  Update a user's password

  Returns `:updated` if successful or `:unknown` if user is unknown.

  __Parameters__
  - `name` the user's name.
  - `password` the user's name.
  """
  def update_password(name, password) do
    CouchService.update_password(name, password)
    |> case do
      %{status_code: 201} ->
        :updated

      %{status_code: 404} ->
        :unknown
    end
  end

  @doc """
  Check if a user exists.

  __Parameters__
  - `name` the user's name.
  """
  def exists?(name) do
    CouchService.get_user(name)
    |> case do
      %{status_code: 200} ->
        true

      %{status_code: 404} ->
        false
    end
  end

  def is_admin?(name) do
    name == Application.get_env(:field_hub, :couchdb_admin_name)
  end
end
