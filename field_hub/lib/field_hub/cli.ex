defmodule FieldHub.CLI do
  @couch_url Application.get_env(:field_hub, :couchdb_root)
  @couch_admin_name Application.get_env(:field_hub, :couchdb_admin_name)
  @couch_admin_password Application.get_env(:field_hub, :couchdb_admin_password)

  require Logger
  def create_project(project_name) do

    Logger.info("Adding project #{project_name}.")

    HTTPoison.put!(
      "#{@couch_url}/#{project_name}",
      "",
      get_request_headers()
    )

    FieldHub.ImageStore.create_directories(project_name)
  end

  def create_user(user_name) do

    password_length = 32

    password =
      :crypto.strong_rand_bytes(password_length)
      |> Base.encode64()
      |> binary_part(0, password_length)

    %{status_code: status_code} =
      HTTPoison.put!(
        "#{@couch_url}/_users/org.couchdb.user:#{user_name}",
        Jason.encode!(%{name: user_name, password: password, roles: [], type: "user"}),
        get_request_headers()
      )

    if status_code == 409 do
      Logger.info("User '#{user_name}' already exists.")
    else
      Logger.info("Created user '#{user_name}' with password '#{password}'.")
    end
  end

  def set_password(user_name, user_password) do

    default_headers = get_request_headers()

    %{"_rev" => rev } =
      HTTPoison.get!(
        "#{@couch_url}/_users/org.couchdb.user:#{user_name}",
        default_headers
      )
      |> Map.get(:body)
      |> Jason.decode!()

    HTTPoison.put!(
      "#{@couch_url}/_users/org.couchdb.user:#{user_name}",
      Jason.encode!(%{name: user_name, password: user_password, roles: [], type: "user"}),
      default_headers ++ [{"If-Match", rev}]
    )
  end

  def add_user_as_project_admin(user_name, project) do

    Logger.info("Adding #{user_name} as admin for project #{project}.")

    %{ body: body } =
      HTTPoison.get!(
        "#{@couch_url}/#{project}/_security",
        get_request_headers()
      )

    %{ "admins" => existing_admins, "members" => existing_members } = Jason.decode!(body)

    update_data =
      %{
        admins: %{
          names:
            Map.get(existing_admins, "names", []) ++ [user_name]
            |> Enum.dedup(),
          roles: existing_admins["roles"]
        },
        members: existing_members
      }
      |> Jason.encode!()

    HTTPoison.put!(
      "#{@couch_url}/#{project}/_security",
      update_data,
      get_request_headers()
    )
  end

  def add_user_as_project_member(user_name, project) do

    Logger.info("Adding #{user_name} as member for project #{project}.")

    %{ body: body } =
      HTTPoison.get!(
        "#{@couch_url}/#{project}/_security",
        get_request_headers()
      )

    %{ "admins" => existing_admins, "members" => existing_members } = Jason.decode!(body)

    update_data =
      %{
        admins: existing_admins,
        members: %{
          names:
            Map.get(existing_members, "names", []) ++ [user_name]
            |> Enum.dedup(),
          roles: existing_members["roles"]
        }
      }
      |> Jason.encode!()

    HTTPoison.put!(
      "#{@couch_url}/#{project}/_security",
      update_data,
      get_request_headers()
    )
  end

  defp get_request_headers() do
    credentials =
      "#{@couch_admin_name}:#{@couch_admin_password}"
      |> Base.encode64()

    [
      {"Content-Type", "application/json"},
      {"Authorization", "Basic #{credentials}"}
    ]
  end
end
