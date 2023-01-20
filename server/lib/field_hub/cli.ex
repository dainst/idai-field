defmodule FieldHub.CLI do

  alias FieldHub.{
    CouchService,
    FileStore,
    Issues,
    Project,
    User
  }

  require Logger

  def setup() do
    HTTPoison.start()

    Logger.info("RUNNING SETUP")

    admin_user = Application.get_env(:field_hub, :couchdb_admin_name)
    app_user = Application.get_env(:field_hub, :couchdb_user_name)

    Logger.info("Running initial CouchDB setup for single node at #{CouchService.base_url()}...")
    # See https://docs.couchdb.org/en/3.2.0/setup/single-node.html

    {users, replicator} =
      CouchService.initial_setup(%CouchService.Credentials{
        name: admin_user,
        password: Application.get_env(:field_hub, :couchdb_admin_password)
      })

    case users do
      %{status_code: 412} ->
        Logger.warning(
          "System database '_users' already exists. You probably ran the CouchDB setup on an existing instance."
        )

      %{status_code: code} when 199 < code and code < 300 ->
        Logger.info("Created system database `_users`.")
    end

    case replicator do
      %{status_code: 412} ->
        Logger.warning(
          "System database '_replicator' already exists. You probably ran the CouchDB setup on an existing instance."
        )

      %{status_code: code} when 199 < code and code < 300 ->
        Logger.info("Created system database `_replicator`.")
    end

    User.create(
      app_user,
      Application.get_env(:field_hub, :couchdb_user_password)
    )
    |> case do
      :created ->
        Logger.info("Created application user '#{app_user}'.")

      :already_exists ->
        Logger.warning("Application user '#{app_user}' already exists.")
    end

    admin_user
    |> Project.get_all_for_user()
    |> Enum.each(fn project_name ->
      Logger.info("Running setup for existing project #{project_name}.")
      Project.update_user(app_user, project_name, :member)
      |> case do
        :set ->
          Logger.info("- User '#{app_user}' is set as member of project '#{project_name}'.")
      end

      FileStore.create_directories(project_name)
      |> Enum.each(fn {variant_name, :ok} ->
        Logger.info("- File directory for '#{variant_name}' is setup for project '#{project_name}'.")
      end)
    end)

    Logger.info("Setup done.")
  end

  def create_project(project_name) do
    create_project(project_name, CouchService.create_password())
  end

  def create_project(project_name, password) do
    HTTPoison.start()

    Logger.info("Creating project #{project_name}.")

    response = Project.create(project_name)

    case response do
      :invalid_name ->
        Logger.error("Invalid project name '#{project_name}'.")

      %{database: database, file_store: file_store} ->
        case database do
          :already_exists ->
            Logger.warning("Project database '#{project_name}' already exists.")

          :created ->
            Logger.info("Created project database '#{project_name}'.")
        end

        file_store
        |> Enum.map(fn result ->
          case result do
            {file_variant, :ok} ->
              Logger.info("Created directory for '#{file_variant}'.")

            {file_variant, posix} ->
              Logger.info("Unable to create directory for '#{file_variant}': #{posix}")
          end
        end)

        create_user(project_name, password)

        Project.update_user(project_name, project_name, :member)
        |> case do
          :set ->
            Logger.info("Set user '#{project_name}' as member to project '#{project_name}'.")
        end

        Logger.info("Project creation done.")
    end
  end

  def delete_project(project_name) do
    HTTPoison.start()

    Project.delete(project_name)
    |> case do
      %{database: :unknown_project, file_store: _file_store} = result ->
        Logger.warning("Project database '#{project_name}' does not exists.")
        result

      %{database: :deleted, file_store: _file_store} = result ->
        Logger.info("Deleted project database '#{project_name}'.")
        result
    end
    |> case do
      %{database: _, file_store: file_store} ->
        file_store
        |> Enum.map(fn result ->
          case result do
            {:ok, file_variant} ->
              Logger.info("Deleted directory for '#{file_variant}'.")
          end
        end)
    end

    delete_user(project_name)
  end

  def create_user(user_name) do
    create_user(user_name, CouchService.create_password())
  end

  def create_user(user_name, password) do
    HTTPoison.start()

    User.create(user_name, password)
    |> case do
      :created ->
        Logger.info("Created user '#{user_name}' with password '#{password}'.")

      :already_exists ->
        Logger.info("User '#{user_name}' already exists.")
    end
  end

  def delete_user(user_name) do
    HTTPoison.start()

    User.delete(user_name)
    |> case do
      :deleted ->
        Logger.info("Deleted user '#{user_name}'.")

      :unknown ->
        Logger.warning("Unknown user '#{user_name}'.")
    end
  end

  def set_password(user_name, user_password) do
    HTTPoison.start()

    User.update_password(user_name, user_password)
    |> case do
      :updated ->
        Logger.info("Updated password for user '#{user_name}'.")

      :unknown ->
        Logger.warning("Unknown user '#{user_name}'.")
    end
  end

  def add_user_as_project_admin(user_name, project_name) do
    HTTPoison.start()

    Project.update_user(user_name, project_name, :admin)
    |> case do
      :set ->
        Logger.info("User '#{user_name}' has been set as admin to '#{project_name}'.")

      :unknown_project ->
        Logger.warning("Tried to set user '#{user_name}' to unknown project '#{project_name}'.")

      :unknown_user ->
        Logger.warning("Tried to set unknown user '#{user_name}' to project '#{project_name}'.")
    end
  end

  def add_user_as_project_member(user_name, project_name) do
    HTTPoison.start()

    Project.update_user(user_name, project_name, :member)
    |> case do
      :set ->
        Logger.info("User '#{user_name}' has been set as member to '#{project_name}'.")

      :unknown_project ->
        Logger.warning("Tried to set user '#{user_name}' to unknown project '#{project_name}'.")

      :unknown_user ->
        Logger.warning("Tried to set unknown user '#{user_name}' to project '#{project_name}'.")
    end
  end

  def remove_user_from_project(user_name, project_name) do
    HTTPoison.start()

    Project.update_user(user_name, project_name, :none)
    |> case do
      :unset ->
        Logger.info("User '#{user_name}' has been unset from all roles in '#{project_name}'.")

      :unknown_project ->
        Logger.warning(
          "Tried to unset user '#{user_name}' from unknown project '#{project_name}'."
        )

      :unknown_user ->
        Logger.warning(
          "Tried to unset unknown user '#{user_name}' from project '#{project_name}'."
        )
    end
  end

  def get_project_statistics() do
    Application.get_env(:field_hub, :couchdb_admin_name)
    |> Project.evaluate_all_projects_for_user()
    |> Enum.each(&print_statistics/1)
  end

  def get_project_statistics(project_name) do
    project_name
    |> Project.evaluate_project()
    |> print_statistics()
  end

  def get_project_issues(project_name) do
    project_name
    |> Issues.evaluate_all()
    |> print_issues()
  end

  defp print_statistics(%{name: project_name, database: db, files: files}) do
    header = "######### Project '#{project_name}' #########"

    Logger.info(header)
    Logger.info("Database documents: #{db[:doc_count]}")
    Logger.info("Database size: #{Sizeable.filesize(db[:file_size])} (#{db[:file_size]} bytes)")

    case files do
      :enoent ->
        Logger.warning("No files directory found for '#{project_name}'.")

      values ->
        values
        |> Enum.each(fn {file_type, file_info} ->
          Logger.info(
            "#{get_file_type_label(file_type)} files: #{file_info[:active]}, size: #{Sizeable.filesize(file_info[:active_size])} (#{file_info[:active_size]} bytes)"
          )
        end)
    end

    Logger.info("#{String.duplicate("#", String.length(header))}\n")
  end

  def print_issues([]) do
    Logger.info("No issues found.")
  end

  def print_issues(issues) do
    issues
    |> Enum.each(fn %Issues.Issue{type: type, severity: severity, data: data} ->
      case severity do
        :info ->
          print_issue(type, data, &Logger.info/1)

        :warning ->
          print_issue(type, data, &Logger.warning/1)

        _ ->
          print_issue(type, data, &Logger.error/1)
      end
    end)
  end

  defp print_issue(type, data, logger_function) do
    case Map.values(data) do
      [] ->
        logger_function.("Issue: #{type}.")

      _vals ->
        logger_function.("Issue: #{type}:")
    end

    data
    |> Enum.each(fn {key, value} ->
      logger_function.("- #{key}: #{value}")
    end)
  end

  defp get_file_type_label(type) do
    case type do
      :original_image ->
        "Original image"

      :thumbnail_image ->
        "Thumbnail image"
    end
  end
end
