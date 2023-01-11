defmodule FieldHub.Project do
  alias FieldHub.{
    CouchService,
    FileStore
  }

  import CouchService.Credentials

  require Logger

  @variant_types Application.compile_env(:field_hub, :file_variant_types)

  def create(project_name) do
    couch_result =
      project_name
      |> CouchService.create_project(CouchService.get_admin_credentials())
      |> case do
        %{status_code: 201} ->
          :created

        %{status_code: 400} ->
          :invalid_name

        %{status_code: 412} ->
          :already_exists
      end

    case couch_result do
      :invalid_name ->
        :invalid_name

      val ->
        update_user(
          Application.get_env(:field_hub, :couchdb_user_name),
          project_name,
          :member
        )

        file_store_response = FileStore.create_directories(project_name)
        %{database: val, file_store: file_store_response}
    end
  end

  def delete(project_name) do
    couch_result =
      project_name
      |> CouchService.delete_project(CouchService.get_admin_credentials())
      |> case do
        %{status_code: 200} ->
          :deleted

        %{status_code: 404} ->
          :unknown_project
      end

    # Deactivated for now, we do not really delete images for existing projects (we are just adding tombstone files)
    # so we probably should also keep the files directory when deleting project (?).
    # FileStore.remove_directories(project_name)
    # |> case do
    #   {:ok, deleted} ->
    #     Logger.info("Deleted #{Enum.count(deleted)} files for '#{project_name}'.")
    #     deleted
    #     |> Enum.each(&Logger.info(&1))

    #   {:error, reason, file} ->
    #     Logger.error("Got posix error #{reason} while trying to delete #{file}.")
    # end

    %{database: couch_result, file_store: []}
  end

  def update_user(user_name, project_name, role) do
    CouchService.update_user_role_in_project(
      user_name,
      project_name,
      CouchService.get_admin_credentials(),
      role
    )
    |> case do
      %{status_code: 200} when role == :none ->
        :unset

      %{status_code: 200} ->
        :set

      {:unknown_project, _res} ->
        :unknown_project

      {:unknown_user, _res} ->
        :unknown_user
    end
  end

  def get_all_for_user(user_name) do
    CouchService.get_all_databases()
    |> Enum.filter(fn project_name ->
      :granted == check_project_authorization(project_name, user_name)
    end)
  end

  def exists?(project_name) do
    CouchService.get_db_infos(project_name)
    |> case do
      %{status_code: 200} ->
        true

      %{status_code: 404} ->
        false
    end
  end

  def evaluate_project(project_name) do
    project_name
    |> evaluate_database()
    |> case do
      :unknown ->
        :unknown

      db_statistics ->
        file_statistics = evaluate_file_store(project_name)

        %{
          name: project_name,
          database: db_statistics,
          files: file_statistics
        }
    end
  end

  def check_project_authorization(project_name, user_name) do
    if user_name == Application.get_env(:field_hub, :couchdb_admin_name) do
      :granted
    else
      CouchService.get_database_security(project_name)
      |> case do
        %{status_code: 200, body: body} ->
          %{"members" => members, "admins" => admins} = Jason.decode!(body)

          existing_members = Map.get(members, "names", [])
          existing_admins = Map.get(admins, "names", [])

          if user_name in (existing_members ++ existing_admins) do
            :granted
          else
            :denied
          end

        %{status_code: 404} ->
          :unknown_project
      end
    end
  end

  def evaluate_all_projects_for_user(user_name) do
    user_name
    |> get_all_for_user()
    |> Enum.map(&evaluate_project(&1))
  end

  defp evaluate_database(project_name) do
    FieldHub.CouchService.get_db_infos(project_name)
    |> case do
      %{status_code: 200, body: body} ->
        %{"doc_count" => db_doc_count, "sizes" => %{"file" => db_file_size}} = Jason.decode!(body)

        %{doc_count: db_doc_count, file_size: db_file_size}

      %{status_code: 404} ->
        :unknown
    end
  end

  defp evaluate_file_store(project_name) do
    FileStore.get_file_list(project_name)
    |> Enum.reduce(
      Map.new(@variant_types, fn type ->
        {type,
         %{
           active: 0,
           active_size: 0,
           deleted: 0,
           deleted_size: 0
         }}
      end),
      fn {_uuid, %{deleted: deleted, variants: variants}}, accumulated_stats ->
        variants
        |> Stream.map(fn %{name: name, size: size} ->
          case deleted do
            true ->
              %{
                name => %{
                  deleted: 1,
                  deleted_size: size
                }
              }

            _ ->
              %{
                name => %{
                  active: 1,
                  active_size: size
                }
              }
          end
        end)
        |> Enum.reduce(&Map.merge/2)
        |> Map.merge(accumulated_stats, fn _key,
                                           current_uuid_variant_stats,
                                           accumulated_variant_stats ->
          Map.merge(
            current_uuid_variant_stats,
            accumulated_variant_stats,
            fn _key_b, counter_value_current, counter_value_accumulated ->
              counter_value_current + counter_value_accumulated
            end
          )
        end)
      end
    )
  end
end
