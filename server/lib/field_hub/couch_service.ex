defmodule FieldHub.CouchService do
  defmodule Credentials do
    defstruct name: "<user_name>", password: "<user_password>"
  end

  require Logger

  def authenticate(project, %Credentials{} = credentials) do
    response =
      HTTPoison.get(
        "#{url()}/#{project}",
        headers(credentials)
      )

    case response do
      {:ok, %{status_code: 200}} ->
        :ok

      {:ok, res} ->
        {:error, res}

      error ->
        error
    end
  end

  def initial_setup(%Credentials{} = credentials) do
    {
      HTTPoison.put!(
        "#{url()}/_users",
        "",
        headers(credentials)
      ),
      HTTPoison.put!(
        "#{url()}/_replicator",
        "",
        headers(credentials)
      )
    }
  end

  def create_project(project_name, %Credentials{} = credentials) do
    HTTPoison.put!(
      "#{url()}/#{project_name}",
      "",
      headers(credentials)
    )
  end

  def delete_project(project_name, %Credentials{} = credentials) do
    HTTPoison.delete!(
      "#{url()}/#{project_name}",
      headers(credentials)
    )
  end

  def create_user(name, password, %Credentials{} = credentials) do
    HTTPoison.put!(
      "#{url()}/_users/org.couchdb.user:#{name}",
      Jason.encode!(%{name: name, password: password, roles: [], type: "user"}),
      headers(credentials)
    )
  end

  def delete_user(name, %Credentials{} = credentials) do
    %{"_rev" => rev} =
      HTTPoison.get!(
        "#{url()}/_users/org.couchdb.user:#{name}",
        headers(credentials)
      )
      |> Map.get(:body)
      |> Jason.decode!()

    HTTPoison.delete!(
      "#{url()}/_users/org.couchdb.user:#{name}",
      headers(credentials) ++ [{"If-Match", rev}]
    )
  end

  def set_password(user_name, new_password, %Credentials{} = credentials) do
    %{"_rev" => rev} =
      HTTPoison.get!(
        "#{url()}/_users/org.couchdb.user:#{user_name}",
        headers(credentials)
      )
      |> Map.get(:body)
      |> Jason.decode!()

    HTTPoison.put!(
      "#{url()}/_users/org.couchdb.user:#{user_name}",
      Jason.encode!(%{name: user_name, password: new_password, roles: [], type: "user"}),
      headers(credentials) ++ [{"If-Match", rev}]
    )
  end

  def add_project_admin(user_name, project_name, %Credentials{} = credentials) do
    %{body: body} =
      HTTPoison.get!(
        "#{url()}/#{project_name}/_security",
        headers(credentials)
      )

    %{"admins" => existing_admins, "members" => existing_members} = Jason.decode!(body)

    update_data =
      %{
        admins: %{
          names:
            (Map.get(existing_admins, "names", []) ++ [user_name])
            |> Enum.dedup(),
          roles: existing_admins["roles"]
        },
        members: existing_members
      }
      |> Jason.encode!()

    HTTPoison.put!(
      "#{url()}/#{project_name}/_security",
      update_data,
      headers(credentials)
    )
  end

  def add_project_member(user_name, project_name, %Credentials{} = credentials) do
    %{body: body} =
      HTTPoison.get!(
        "#{url()}/#{project_name}/_security",
        headers(credentials)
      )

    %{"admins" => existing_admins, "members" => existing_members} = Jason.decode!(body)

    update_data =
      %{
        admins: existing_admins,
        members: %{
          names:
            (Map.get(existing_members, "names", []) ++ [user_name])
            |> Enum.dedup(),
          roles: existing_members["roles"]
        }
      }
      |> Jason.encode!()

    HTTPoison.put!(
      "#{url()}/#{project_name}/_security",
      update_data,
      headers(credentials)
    )
  end

  def remove_user_from_project(user_name, project_name, %Credentials{} = credentials) do
    %{body: body} =
      HTTPoison.get!(
        "#{url()}/#{project_name}/_security",
        headers(credentials)
      )

    %{"admins" => existing_admins, "members" => existing_members} = Jason.decode!(body)

    update_data =
      %{
        admins: %{
          names:
            Map.get(existing_admins, "names", [])
            |> List.delete(user_name),
          roles: existing_admins["roles"]
        },
        members: %{
          names:
            Map.get(existing_members, "names", [])
            |> List.delete(user_name),
          roles: existing_members["roles"]
        }
      }
      |> Jason.encode!()

    HTTPoison.put!(
      "#{url()}/#{project_name}/_security",
      update_data,
      headers(credentials)
    )
  end

  def get_databases_for_user(%Credentials{} = credentials) do
    # First check if user credentials are valid...
    "#{url()}/"
    |> HTTPoison.get!(
      credentials
      |> headers()
    )
    |> case do
      %{status_code: 401} ->
        {:error, 401}

      _ ->
        # ...then get all existing database names as administrator and check if user has access.
        "#{url()}/_all_dbs"
        |> HTTPoison.get!(
          get_admin_credentials()
          |> headers()
        )
        |> Map.get(:body)
        |> Jason.decode!()
        |> Stream.reject(fn val ->
          # Filter out CouchDB's internal databases.
          val in ["_replicator", "_users"]
        end)
        |> Enum.filter(fn database_name ->
          "#{url()}/#{database_name}"
          |> HTTPoison.get!(headers(credentials))
          |> case do
            %{status_code: 200} ->
              true

            %{status_code: 403} ->
              false
          end
        end)
    end
  end

  def get_db_infos(%Credentials{} = credentials, project_name) do
    response =
      HTTPoison.get!(
        "#{url()}/#{project_name}",
        headers(credentials)
      )

    case response do
      %{status_code: 200, body: body} ->
        Jason.decode!(body)

      %{status_code: 401} ->
        {:error, 401}

      %{status_code: 403} ->
        {:error, 403}
    end
  end

  def get_docs(%Credentials{} = credentials, project_name, uuids) do
    body =
      %{
        docs:
          uuids
          |> Enum.map(fn uuid ->
            %{id: uuid}
          end)
      }
      |> Jason.encode!()

    %{body: body} =
      HTTPoison.post!(
        "#{url()}/#{project_name}/_bulk_get",
        body,
        headers(credentials)
      )

    Jason.decode!(body)["results"]
  end

  def get_docs_by_type(%Credentials{} = credentials, project_name, types) do
    batch_size = 500

    Stream.resource(
      fn ->
        %{
          selector: %{
            "$or":
              Enum.map(types, fn type ->
                %{
                  resource: %{
                    type: type
                  }
                }
              end)
          },
          limit: batch_size,
          skip: 0
        }
      end,
      fn payload ->
        HTTPoison.post!(
          "#{url()}/#{project_name}/_find",
          Jason.encode!(payload),
          headers(credentials)
        )
        |> case do
          %{status_code: 200, body: body} ->
            body
            |> Jason.decode!()
            |> Map.get("docs")
            |> case do
              [] ->
                {:halt, :ok}

              docs ->
                payload =
                  payload
                  |> Map.update!(:skip, fn previous ->
                    previous + batch_size
                  end)

                {docs, payload}
            end

          error ->
            {:halt, {:error, error}}
        end
      end,
      fn final_payload ->
        case final_payload do
          {:error, error} ->
            throw(error)

          _ ->
            :ok
        end
      end
    )
  end

  def get_admin_credentials() do
    %Credentials{
      name: Application.get_env(:field_hub, :couchdb_admin_name),
      password: Application.get_env(:field_hub, :couchdb_admin_password)
    }
  end

  defp headers(%Credentials{name: user_name, password: user_password}) do
    credentials =
      "#{user_name}:#{user_password}"
      |> Base.encode64()

    [
      {"Content-Type", "application/json"},
      {"Authorization", "Basic #{credentials}"}
    ]
  end

  def url() do
    Application.get_env(:field_hub, :couchdb_url)
  end
end
