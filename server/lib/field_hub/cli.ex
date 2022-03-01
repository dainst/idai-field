defmodule FieldHub.CLI do

  alias FieldHub.CouchService
  alias FieldHub.FileStore

  require Logger

  def setup_couchdb_single_node() do
    HTTPoison.start()

    Logger.info("Running initial CouchDB setup for single node at #{CouchService.url()}...")
    # See https://docs.couchdb.org/en/3.2.0/setup/single-node.html

    {users, replicator } = CouchService.initial_setup(get_admin_credentials())

    case users do
      %{status_code: 412} ->
        Logger.warning("System database '_users' already exists. You probably ran the CouchDB setup on an existing instance.")
      %{status_code: code} when 199 < code and code < 300 ->
        Logger.info("Created system database `_users`.")
    end

    case replicator do
      %{status_code: 412} ->
        Logger.warning("System database '_replicator' already exists. You probably ran the CouchDB setup on an existing instance.")
      %{status_code: code} when 199 < code and code < 300 ->
        Logger.info("Created system database `_replicator`.")
    end
    Logger.info("Single node setup done.")
  end

  def create_project(project_name) do
    HTTPoison.start()

    CouchService.create_project(project_name, get_admin_credentials())
    |> case do
      %{status_code: 412} ->
        Logger.warning("Project database '#{project_name}' already exists.")
      %{status_code: code} when 199 < code and code < 300 ->
        Logger.info("Created project database '#{project_name}'.")
    end

    FileStore.create_directories(project_name)
    |> Enum.each(fn(result) ->
      case result do
        {:ok, file_variant} ->
          Logger.info("Created directory for #{file_variant}.")
        {{:error, reason}, file_variant } ->
          Logger.error("Got posix error #{reason} while trying to create directory for #{file_variant}.")
      end
    end)
  end

  def delete_project(project_name) do
    HTTPoison.start()

    CouchService.delete_project(project_name, get_admin_credentials())
    |> case do
      %{status_code: 412} ->
        Logger.warning("Project database '#{project_name}' already exists.")
      %{status_code: code} when 199 < code and code < 300 ->
        Logger.info("Created project database '#{project_name}'.")
    end

    FileStore.remove_directories(project_name)
    |> Enum.each(fn(result) ->
      case result do
        {{:ok, deleted}, file_variant} ->
          Logger.info("Deleted files for #{file_variant}")
          Logger.info(deleted)
        {{:error, reason, file}, file_variant} ->
          Logger.error("Got posix error #{reason} while trying to delete #{file} for #{file_variant}.")
      end
    end)
  end

  def create_user(name, password) do
    HTTPoison.start()

    %{status_code: status_code} = CouchService.create_user(name, password, get_admin_credentials())
    if status_code == 409 do
      Logger.warning("User '#{name}' already exists.")
    else
      Logger.info("Created user '#{name}' with password '#{password}'.")
    end
  end

  def create_user(user_name) do
    HTTPoison.start()

    password_length = 32
    password =
      :crypto.strong_rand_bytes(password_length)
      |> Base.encode64()
      |> binary_part(0, password_length)

    create_user(user_name, password)
  end

  def delete_user(user_name) do
    HTTPoison.start()

    CouchService.delete_user(user_name, get_admin_credentials())
    |> case do
      %{status_code: 200} ->
        Logger.info("Deleted user #{user_name}.")
      val ->
        Logger.warning(val)
    end
  end

  def set_password(user_name, user_password) do
    HTTPoison.start()

    CouchService.set_password(user_name, user_password, get_admin_credentials())
  end

  def add_user_as_project_admin(user_name, project) do
    HTTPoison.start()

    Logger.info("Adding '#{user_name}' as admin for project '#{project}'.")
    CouchService.add_project_admin(user_name, project, get_admin_credentials())
  end

  def add_user_as_project_member(user_name, project) do
    HTTPoison.start()

    Logger.info("Adding '#{user_name}' as member for project '#{project}'.")
    CouchService.add_project_member(user_name, project, get_admin_credentials())
  end

  def remove_user_from_project(user_name, project) do
    HTTPoison.start()

    Logger.info("Removing '#{user_name}' from project '#{project}'.")
    CouchService.remove_user_from_project(user_name, project, get_admin_credentials())
  end

  defp get_admin_credentials() do
    HTTPoison.start()

    %CouchService.Credentials{
      name: Application.get_env(:field_hub, :couchdb_admin_name),
      password: Application.get_env(:field_hub, :couchdb_admin_password)
    }
  end
end
