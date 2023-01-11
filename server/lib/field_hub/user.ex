defmodule FieldHub.User do
  alias FieldHub.{
    CouchService
  }

  def create(name, password) do
    %{status_code: status_code} =
      CouchService.create_user(name, password, CouchService.get_admin_credentials())

    case status_code do
      201 ->
        :created

      409 ->
        :already_exists
    end
  end

  def delete(user_name) do
    CouchService.delete_user(user_name, CouchService.get_admin_credentials())
    |> case do
      %{status_code: 200} ->
        :deleted

      %{status_code: 404} ->
        :unknown
    end
  end

  def update_password(user_name, user_password) do
    CouchService.update_password(user_name, user_password, CouchService.get_admin_credentials())
    |> case do
      %{status_code: 201} ->
        :updated

      %{status_code: 404} ->
        :unknown
    end
  end

  def exists?(user_name) do
    CouchService.get_user(user_name, CouchService.get_admin_credentials())
    |> case do
      %{status_code: 200} ->
        true

      %{status_code: 404} ->
        false
    end
  end
end
