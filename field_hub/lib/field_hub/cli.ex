defmodule FieldHub.CLI do
  @couch_admin_name Application.get_env(:field_hub, :couchdb_admin_name)
  @couch_admin_password Application.get_env(:field_hub, :couchdb_admin_password)

  alias FieldHub.CouchService
  alias FieldHub.FileStore

  require Logger

  def create_project(project_name) do
    Logger.info("Adding project #{project_name}.")
    CouchService.create_project(project_name, get_admin_credentials())
    FileStore.create_directories(project_name)
  end

  def create_user(name, password) do
    %{status_code: status_code} = CouchService.create_user(name, password, get_admin_credentials())
    if status_code == 409 do
      Logger.info("User '#{name}' already exists.")
    else
      Logger.info("Created user '#{name}' with password '#{password}'.")
    end
  end

  def create_user(user_name) do
    password_length = 32
    password =
      :crypto.strong_rand_bytes(password_length)
      |> Base.encode64()
      |> binary_part(0, password_length)

    create_user(user_name, password)
  end

  def set_password(user_name, user_password) do
    CouchService.set_password(user_name, user_password, get_admin_credentials())
  end

  def add_user_as_project_admin(user_name, project) do
    Logger.info("Adding #{user_name} as admin for project #{project}.")
    CouchService.add_project_admin(user_name, project, get_admin_credentials())
  end

  def add_user_as_project_member(user_name, project) do
    Logger.info("Adding #{user_name} as member for project #{project}.")
    CouchService.add_project_member(user_name, project, get_admin_credentials())
  end

  def remove_user_from_project(user_name, project) do
    Logger.info("Removing #{user_name} from project #{project}.")
    CouchService.remove_user_from_project(user_name, project, get_admin_credentials())
  end

  defp get_admin_credentials() do
    %CouchService.Credentials{name: @couch_admin_name, password: @couch_admin_password}
  end
end
