defmodule FieldHub.CouchService do
  defmodule Credentials do
    defstruct name: "<user_name>", password: "<user_password>"
  end

  require Logger

  @doc """
  Authenticate with given `%Credentials{}`.

  Returns `:ok` if credentials are valid, otherwise `{:error, reason}`.
  """
  def authenticate(%Credentials{} = credentials) do
    response =
      HTTPoison.get(
        "#{base_url()}/",
        headers(credentials)
      )

    case response do
      {:ok, %{status_code: 200}} ->
        :ok

      {:ok, res} ->
        {:error, res}
    end
  end

  @doc """
  Authenticate with given `%Credentials{}` and check if authorized to access project.

  Returns `:ok` if credentials are valid and user is authorized, otherwise `{:error, reason}`.

  """
  def authenticate_and_authorize(%Credentials{} = credentials, project_name) do
    response =
      HTTPoison.get(
        "#{base_url()}/#{project_name}",
        headers(credentials)
      )

    case response do
      {:ok, %{status_code: 200}} ->
        :ok

      {:ok, res} ->
        {:error, res}
    end
  end

  @doc """
  Creates CouchDB's internal databases `_users` and `_replicator` using the given `%Credentials{}`.

  Returns a tuple with two `HTTPoison.Response` for each creation attempt.
  """
  def initial_setup(%Credentials{} = credentials) do
    {
      HTTPoison.put!(
        "#{base_url()}/_users",
        "",
        headers(credentials)
      ),
      HTTPoison.put!(
        "#{base_url()}/_replicator",
        "",
        headers(credentials)
      )
    }
  end

  @doc """
  Creates a project database of the given name using the given `%Credentials{}`.

  Returns the `HTTPoison.Response` for the creation attempt.
  """
  def create_project(project_name, %Credentials{} = credentials) do
    HTTPoison.put!(
      "#{base_url()}/#{project_name}",
      "",
      headers(credentials)
    )
  end

  @doc """
  Deletes the project database of the given name using the given `%Credentials{}`.

  Returns the `HTTPoison.Response` for the deletion attempt.
  """
  def delete_project(project_name, %Credentials{} = credentials) do
    HTTPoison.delete!(
      "#{base_url()}/#{project_name}",
      headers(credentials)
    )
  end

  @doc """
  Creates a CouchDB user with the given name and password using the given `%Credentials{}`.

  Returns the `HTTPoison.Response` for the creation attempt.
  """
  def create_user(name, password, %Credentials{} = credentials) do
    HTTPoison.put!(
      "#{base_url()}/_users/org.couchdb.user:#{name}",
      Jason.encode!(%{name: name, password: password, roles: [], type: "user"}),
      headers(credentials)
    )
  end

  @doc """
  Deletes a CouchDB user with the given name using the given `%Credentials{}`.

  Returns the `HTTPoison.Response` for the deletion attempt.
  """
  def delete_user(name, %Credentials{} = credentials) do
    HTTPoison.get!(
      "#{base_url()}/_users/org.couchdb.user:#{name}",
      headers(credentials)
    )
    |> case do
      %{status_code: 200, body: body} ->
        %{"_rev" => rev} =
          body
          |> Jason.decode!()

        HTTPoison.delete!(
          "#{base_url()}/_users/org.couchdb.user:#{name}",
          headers(credentials) ++ [{"If-Match", rev}]
        )

      %{status_code: 404} = response ->
        # User was not found
        response
    end
  end

  @doc """
  Sets the password for a CouchDB user with the given name using the given `%Credentials{}`.

  Returns the `HTTPoison.Response` for the update attempt.
  """
  def set_password(user_name, new_password, %Credentials{} = credentials) do
    %{"_rev" => rev} =
      HTTPoison.get!(
        "#{base_url()}/_users/org.couchdb.user:#{user_name}",
        headers(credentials)
      )
      |> Map.get(:body)
      |> Jason.decode!()

    HTTPoison.put!(
      "#{base_url()}/_users/org.couchdb.user:#{user_name}",
      Jason.encode!(%{name: user_name, password: new_password, roles: [], type: "user"}),
      headers(credentials) ++ [{"If-Match", rev}]
    )
  end

  @doc """
  Adds a CouchDB user with the given name as admin for the given project using the given `%Credentials{}`.

  Returns the `HTTPoison.Response` for the update attempt.
  """
  def add_project_admin(user_name, project_name, %Credentials{} = credentials) do
    %{body: body} =
      HTTPoison.get!(
        "#{base_url()}/#{project_name}/_security",
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
      "#{base_url()}/#{project_name}/_security",
      update_data,
      headers(credentials)
    )
  end

  @doc """
  Adds a CouchDB user with the given name as member for the given project using the given `%Credentials{}`.

  Returns the `HTTPoison.Response` for the update attempt.
  """
  def add_project_member(user_name, project_name, %Credentials{} = credentials) do
    %{body: body} =
      HTTPoison.get!(
        "#{base_url()}/#{project_name}/_security",
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
      "#{base_url()}/#{project_name}/_security",
      update_data,
      headers(credentials)
    )
  end

  @doc """
  Removes a CouchDB user with the given name from all roles in the given project using the given `%Credentials{}`.

  Returns the `HTTPoison.Response` for the update attempt.
  """
  def remove_user_from_project(user_name, project_name, %Credentials{} = credentials) do
    %{body: body} =
      HTTPoison.get!(
        "#{base_url()}/#{project_name}/_security",
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
      "#{base_url()}/#{project_name}/_security",
      update_data,
      headers(credentials)
    )
  end

  @doc """
  Checks if the given user is authorized to access the given project.

  Returns `true` or `false`.
  """
  def has_project_access?(user_name, project_name) do
    if user_name == Application.get_env(:field_hub, :couchdb_admin_name) do
      true
    else
      # TODO: Check if user has admin role in the project.
      %{"members" => %{"names" => existing_members}} =
        "#{base_url()}/#{project_name}/_security"
        |> HTTPoison.get!(headers())
        |> Map.get(:body)
        |> Jason.decode!()

      if user_name in existing_members do
        true
      else
        false
      end
    end
  end

  @doc """
  Gets all projects the given user has access to.

  Returns a list of project names.
  """
  def get_databases_for_user(user_name) do
    "#{base_url()}/_all_dbs"
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
      has_project_access?(user_name, database_name)
    end)
  end

  @doc """
  Get CouchDB's basic metadata for the given project.
  """
  def get_db_infos(project_name) do
    HTTPoison.get!(
      "#{base_url()}/#{project_name}",
      headers()
    )
    |> Map.get(:body)
    |> Jason.decode!()
  end

  def get_docs(project_name, uuids) do
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
        "#{base_url()}/#{project_name}/_bulk_get",
        body,
        headers()
      )

    body
    |> Jason.decode!()
    |> Map.get("results")
    |> Enum.map(fn %{"docs" => result} ->
      case result do
        [%{"ok" => doc}] ->
          doc

        [%{"error" => %{"id" => uuid, "error" => error, "reason" => reason}}] ->
          {:error, %{uuid: uuid, error: error, reason: reason}}
      end
    end)
  end

  @doc """
  Returns `Stream` for all documents of the given resource types for the given project.any()

  Returns a list of docs found using CouchDBs `_find` endpoint.

  ## Example
      iex> CouchService.get_docs_by_type("development", ["Image", "Photo", "Drawing"]) |> Enum.to_list()
      [
        %{
          "_id" => "5cc25dd3-0f39-47a4-b3d8-4a74427f8c6a",
          "_rev" => "1-c656e9c8690925daaa293fe695e608a8",
          "created" => %{"date" => "2022-11-08T08:31:23.359Z", "user" => "anonymous"},
          "modified" => [],
          "resource" => %{
            "height" => 900,
            "id" => "5cc25dd3-0f39-47a4-b3d8-4a74427f8c6a",
            "identifier" => "7W7z07j.jpg",
            "originalFilename" => "7W7z07j.jpg",
            "relations" => %{},
            "type" => "Drawing",
            "width" => 1600
          }
        },
        %{
          "_id" => "7677d2d3-5dcd-4d9c-bcfb-6f6a108c1039",
          "_rev" => "1-54c34b9639e3fda7aa9005033d0a832e",
          "created" => %{"date" => "2022-12-14T11:43:07.290Z", "user" => "anonymous"},
          "modified" => [],
          "resource" => %{
            "height" => 1031,
            "id" => "7677d2d3-5dcd-4d9c-bcfb-6f6a108c1039",
            "identifier" => "field_ua.jpg",
            "originalFilename" => "field_ua.jpg",
            "relations" => %{},
            "type" => "Drawing",
            "width" => 1920
          }
        },
        %{
          "_id" => "880dbf25-ec76-481b-a47e-a7265b7b6164",
          "_rev" => "1-94ef61e6300074fc0a6ee2909e9b5402",
          "created" => %{"date" => "2022-12-14T12:52:30.122Z", "user" => "anonymous"},
          "modified" => [],
          "resource" => %{
            "height" => 1080,
            "id" => "880dbf25-ec76-481b-a47e-a7265b7b6164",
            "identifier" => "aldrin.png",
            "originalFilename" => "aldrin.png",
            "relations" => %{},
            "type" => "Photo",
            "width" => 1920
          }
        }
      ]
  """
  def get_docs_by_type(project_name, types) do
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
          "#{base_url()}/#{project_name}/_find",
          Jason.encode!(payload),
          headers()
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

  @doc """
  Should only used by `CouchService` internally or by the CLI module!

  Returns `%Credentials{}` for the CouchDB admin as defined in `Application` environment.
  """
  def get_admin_credentials() do
    %Credentials{
      name: Application.get_env(:field_hub, :couchdb_admin_name),
      password: Application.get_env(:field_hub, :couchdb_admin_password)
    }
  end

  defp get_user_credentials() do
    %Credentials{
      name: Application.get_env(:field_hub, :couchdb_user_name),
      password: Application.get_env(:field_hub, :couchdb_user_password)
    }
  end

  defp headers() do
    get_user_credentials()
    |> headers()
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

  def base_url() do
    Application.get_env(:field_hub, :couchdb_url)
  end

  def create_password(length) do
    length
    |> :crypto.strong_rand_bytes()
    |> Base.encode64()
    |> binary_part(0, length)
  end
end
