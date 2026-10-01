defmodule FieldPublication.User do
  use Ecto.Schema
  import Ecto.Changeset

  alias FieldPublication.CouchService

  @user_db "_users"

  @moduledoc """
  This module defines the primary `User` struct as an embedded Ecto schema and its related functions for
  creating, updating and deleting users in CouchDB.
  """
  @primary_key false
  embedded_schema do
    field(:_id, :string)
    field(:_rev, :string)
    field(:type, :string, default: "user")
    field(:roles, {:array, :string}, default: [])
    field(:name, :string)
    field(:password, :string, redact: true)
    field(:label, :string)
    field(:admin?, :boolean, default: false)
    field(:email, :string)
  end

  def changeset(%__MODULE__{name: existing_name} = user, attrs \\ %{}, create? \\ false) do
    required_fields = [:name, :label, :email] ++ if create?, do: [:password], else: []

    user
    |> cast(attrs, [:_id, :_rev, :type, :roles, :name, :password, :label, :admin?, :email])
    |> validate_length(:password, min: 10)
    |> validate_required(required_fields)
    |> set_id()
    |> validate_unique_email()
    |> prevent_name_change(existing_name)
  end

  defp set_id(changeset) do
    id =
      changeset
      |> get_field(:name)
      |> id()

    put_change(changeset, :_id, id)
  end

  defp validate_unique_email(changeset) do
    email = get_field(changeset, :email)

    if email do
      name = get_field(changeset, :name)

      payload = %{
        selector: %{
          email: email
        }
      }

      CouchService.get_document_stream(payload, @user_db)
      |> Enum.to_list()
      |> case do
        [] ->
          changeset

        [%{"name" => existing_name}] when existing_name == name ->
          changeset

        _other ->
          add_error(changeset, :email, "Email already associated with different user.")
      end
    else
      changeset
    end
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

  defp id(name) when is_binary(name), do: "org.couchdb.user:#{name}"
  defp id(%__MODULE__{name: name}), do: id(name)
  defp id(_), do: nil

  @doc """
  Get `%User{}` from the database by `name`.

  Returns `{:ok, %User{}}` on success, `{:error, :not_found}` otherwise.
  """
  def get(name) when is_binary(name) do
    id = id(name)

    CouchService.get_document(id, @user_db)
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

      {:ok, %__MODULE__{} = user} ->
        CouchService.put_document(user._id, user, @user_db)
        |> case do
          {:ok, %{status: 201, body: body}} ->
            rev =
              body
              |> Jason.decode!()
              |> Map.get("rev")

            user =
              user
              |> Map.put(:_rev, rev)
              # Strip password from struct to avoid leakage. Querying the document from CouchDB
              # will also returned without the password value as a CouchDB default behaviour.
              |> Map.put(:password, nil)

            {:ok, Map.put(user, :_rev, rev)}

          {:ok, %{status: 409}} ->
            user
            |> changeset()
            |> add_error(:name, "name '#{user.name}' already taken.")
            |> apply_action(:validate)
        end
    end
  end

  def delete(%__MODULE__{} = user) do
    CouchService.delete_document(user._id, user._rev, @user_db)
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
  def update(%__MODULE__{} = user, params) do
    user
    |> changeset(params)
    |> apply_action(:update)
    |> case do
      {:error, _changeset} = error ->
        error

      {:ok, user} ->
        CouchService.put_document(user._id, user, @user_db)
        |> case do
          {:ok, %{status: 201, body: body}} ->
            rev =
              body
              |> Jason.decode!()
              |> Map.get("_rev")

            {:ok, Map.put(user, :_rev, rev)}

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
  def is_admin?(nil) do
    false
  end

  def is_admin?(name) when is_binary(name) do
    name == Application.get_env(:field_publication, :couchdb_admin_name) ||
      get(name)
      |> case do
        {:ok, %__MODULE__{admin?: val}} -> val
        _ -> false
      end
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
