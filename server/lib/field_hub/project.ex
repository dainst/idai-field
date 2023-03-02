defmodule FieldHub.Project do
  alias FieldHub.{
    CouchService,
    FileStore
  }

  import CouchService.Credentials

  require Logger

  @variant_types Application.compile_env(:field_hub, :valid_file_variants)

  @moduledoc """
  Bundles functions concerning Field projects in FieldHub.
  """

  @doc """
  Create a project and a default user with the given name.

  Returns `:invalid_name` if the requested project name falls outside of CouchDB's constraints for
  database names. See https://docs.couchdb.org/en/stable/api/database/common.html#put--db. Otherwise the function
  returns `%{database: :already_exists | :created, file_store: <file store response>}}` where the file store response
  is the return value of FileStore.create_directories/1.

  __Parameters__
  - `project_identifier` the project's name
  """
  def create(project_identifier) do
    couch_result =
      project_identifier
      |> CouchService.create_project()
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
          project_identifier,
          :member
        )

        file_store_response = FileStore.create_directories(project_identifier)
        %{database: val, file_store: file_store_response}
    end
  end

  @doc """
  Deletes the project by name. Currently the project's file directory (images...) will
  be left intact in the filesystem.

  Returns `%{dabase :deleted | :unknown_project, file_store: []}`.

  __Parameters__
  - `project_identifier` the project's name.
  """
  def delete(project_identifier) do
    couch_result =
      project_identifier
      |> CouchService.delete_project()
      |> case do
        %{status_code: 200} ->
          :deleted

        %{status_code: 404} ->
          :unknown_project
      end

    # Deactivated for now, we do not really delete images for existing projects (we are just adding tombstone files)
    # so we probably should also keep the files directory when deleting project (?).
    # FileStore.remove_directories(project_identifier)
    # |> case do
    #   {:ok, deleted} ->
    #     Logger.info("Deleted #{Enum.count(deleted)} files for '#{project_identifier}'.")
    #     deleted
    #     |> Enum.each(&Logger.info(&1))

    #   {:error, reason, file} ->
    #     Logger.error("Got posix error #{reason} while trying to delete #{file}.")
    # end

    %{database: couch_result, file_store: []}
  end

  @doc """
  Updates a user's role within a project.

  Returns `:set | :unknown_project | :unknown_user | :unset`.

  __Parameters__
  - `user_name` the user's name.
  - `project_identifier` the project's name.
  - `role` the user's intended role in the project. Valid values: `:none` (removing user from all current roles), `:member` or `:admin`.
  """
  def update_user(user_name, project_identifier, role) do
    CouchService.update_user_role_in_project(
      user_name,
      project_identifier,
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

  @doc """
  Checks if a project of the given name exists.

  __Parameters__
  - `project_identifier` the project's name.
  """
  def exists?(project_identifier) do
    CouchService.get_db_infos(project_identifier)
    |> case do
      %{status_code: 200} ->
        true

      %{status_code: 404} ->
        false
    end
  end

  @doc """
  Returns a list of names for all projects the given user has access to (as admin or member).

  __Parameters__
  - `user_name` the user's name.
  """
  def get_all_for_user(user_name) do
    CouchService.get_all_databases()
    |> Enum.filter(fn project_identifier ->
      :granted == check_project_authorization(project_identifier, user_name)
    end)
  end

  @doc """
  Collects some basic statistics about the given project.

  Returns `:unknown` if the provided project name is unknown, otherwise returns information about the
  project's database and file store state.

  __Parameters__
  - `project_identifier` the project's name.

  ## Example
      iex> Project.evaluate_project("development")

      %{
        database: %{doc_count: 7, file_size: 766362},
        files: %{
          original_image: %{
            active: 3,
            active_size: 1079929,
            deleted: 0,
            deleted_size: 0
          },
          thumbnail_image: %{
            active: 5,
            active_size: 95624,
            deleted: 0,
            deleted_size: 0
          }
        },
        name: "development"
      }
  """
  def evaluate_project(project_identifier) do
    project_identifier
    |> evaluate_database()
    |> case do
      :unknown ->
        :unknown

      db_statistics ->
        file_statistics = evaluate_file_store(project_identifier)

        %{
          name: project_identifier,
          database: db_statistics,
          files: file_statistics
        }
    end
  end

  @doc """
  Returns a list of evaluate_project/2 results for all projects the user has access to.

  __Parameters__
  - `user_name`: The user's name.
  """
  def evaluate_all_projects_for_user(user_name) do
    user_name
    |> get_all_for_user()
    |> Enum.map(&evaluate_project(&1))
  end

  @doc """
  Checks if a user is authorized to access a project.

  Returns `:denied | :granted | :unknown_project`.

  __Parameters__
  - `project_identifier` the project's name.
  - `user_name` the user's name.
  """
  def check_project_authorization(project_identifier, user_name) do
    if user_name == Application.get_env(:field_hub, :couchdb_admin_name) do
      case exists?(project_identifier) do
        true ->
          :granted

        false ->
          :unknown_project
      end
    else
      CouchService.get_database_security(project_identifier)
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

  def get_documents(project_identifier, uuids) do
    FieldHub.CouchService.get_docs(project_identifier, uuids)
  end

  defp evaluate_database(project_identifier) do
    FieldHub.CouchService.get_db_infos(project_identifier)
    |> case do
      %{status_code: 200, body: body} ->
        %{"doc_count" => db_doc_count, "sizes" => %{"file" => db_file_size}} = Jason.decode!(body)

        %{doc_count: db_doc_count, file_size: db_file_size}

      %{status_code: 404} ->
        :unknown
    end
  end

  defp evaluate_file_store(project_identifier) do
    FileStore.file_index(project_identifier)
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
