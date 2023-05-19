defmodule Api.Services.CouchService do
  @fix_source_url Application.compile_env(:api, :fix_couch_source_url, false)

  @system_databases ["_users", "_replicator"]

  @field_users_db Application.compile_env(:api, :field_user_db)

  # We trigger replication using a long running POST on the local CouchDB
  # in order to wait for the replication to finish, we extend the default
  # timeouts of HTTPoison to 10 minutes.
  @replication_timeout 1000 * 60 * 10

  require Logger

  @doc """
  Creates CouchDB's internal databases `_users` and `_replicator` and `_field_publication_users`.

  Returns a tuple with three #{HTTPoison.Response} for each creation attempt.
  """
  def initial_setup() do
    [
      {_, %{status_code: status_code_user}},
      {_, %{status_code: status_code_replicator}},
    ] = Enum.map(@system_databases, &create_database/1)

    case status_code_user do
      412 ->
        Logger.warning(
          "System database '_users' already exists. You probably ran the CouchDB setup on an existing instance."
        )

      code when 199 < code and code < 300 ->
        Logger.info("Created system database `_users`.")
    end

    case status_code_replicator do
      412 ->
        Logger.warning(
          "System database '_replicator' already exists. You probably ran the CouchDB setup on an existing instance."
        )

      code when 199 < code and code < 300 ->
          Logger.info("Created system database `_replicator`.")
    end

    {_, %{status_code: status_code_field_publication_users}} = create_database(@field_users_db)

    case status_code_field_publication_users do
      412 ->
        Logger.warning(
          "Application database '#{@field_users_db}' already exists. You probably ran the CouchDB setup on an existing instance."
        )

      code when 199 < code and code < 300 ->
          Logger.info("Created application database `#{@field_users_db}`.")
    end

    app_user = Application.get_env(:api, :couchdb_user_name)

    create_user(
      app_user,
      Application.get_env(:api, :couchdb_user_password)
    )
    |> then(fn(%{status_code: status_code}) -> status_code end)
    |> case do
      201 ->
        Logger.info("Created application user '#{app_user}'.")

      409 ->
        Logger.warning("Application user '#{app_user}' already exists.")
    end

    add_application_user(@field_users_db)
  end


  @doc """
  Creates a CouchDB user.

  Returns the #{HTTPoison.Response} for the creation attempt.

  __Parameters__
  - `name` the user's name.
  - `password` the user's password.
  """
  def create_user(name, password) do
    HTTPoison.put(
      "#{local_url()}/_users/org.couchdb.user:#{name}",
      Jason.encode!(%{name: name, password: password, roles: [], type: "user"}),
      headers()
    )
  end

  @doc """
  Returns a list of all databases (excluding CouchDB's internal ones: `_users` and `_replicator`).
  """
  def get_all_databases() do
    "#{local_url()}/_all_dbs"
    |> HTTPoison.get!(headers())
    |> Map.get(:body)
    |> Jason.decode!()
    |> Stream.reject(fn val ->
      val in @system_databases
    end)
    |> Enum.to_list()
    |> Enum.sort()
  end

  def create_database(name) do
    HTTPoison.put(
      "#{local_url()}/#{name}",
      "",
      headers()
    )
  end

  def store_document(database_name, doc_id, document) do
    HTTPoison.put(
      "#{local_url()}/#{database_name}/#{doc_id}",
      Jason.encode!(document),
      headers(
        Application.get_env(:api, :couchdb_user_name),
        Application.get_env(:api, :couchdb_user_password)
      )
    )
  end

  def retrieve_document(database_name, doc_id) do
    HTTPoison.get(
      "#{local_url()}/#{database_name}/#{doc_id}",
      headers(
        Application.get_env(:api, :couchdb_user_name),
        Application.get_env(:api, :couchdb_user_password)
      )
    )
  end

  def add_application_user(project_identifier) do

    HTTPoison.get(
      "#{local_url()}/#{project_identifier}/_security",
      headers()
    )
    |> case do
      {:ok, %{status_code: 200, body: body}} ->
        %{"admins" => existing_admins, "members" => existing_members} = Jason.decode!(body)

        updated_names =
          (Map.get(existing_members, "names", []) ++ [Application.get_env(:api, :couchdb_user_name)])
          |> Enum.uniq()

        updated_payload = %{
          admins: existing_admins,
          members: %{
            names: updated_names,
            roles: existing_members["roles"]
          }
        }
        |> Jason.encode!()

        HTTPoison.put(
          "#{local_url()}/#{project_identifier}/_security",
          updated_payload,
          headers()
        )

      {:ok, %{status_code: 404}} = res ->
        {:unknown_project, res}
    end
  end

  def replicate(source_url, source_user, source_password, target_project_name) do

    Logger.debug("Replicating database #{source_url} as #{target_project_name}")

    payload =
      %{
        create_target: true,
        winning_revs_only: true,
        source: %{
          # This URL is relative to the CouchDB application context, not necessarily the same as FieldPublication's.
          url: source_url_fix(source_url),
          headers: headers(source_user, source_password) |> Enum.into(%{})
        },
        target: %{
          # This URL is relative to the CouchDB application context, not necessarily the same as FieldPublication's.
          url: "http://127.0.0.1:5984/#{target_project_name}",
          headers: headers() |> Enum.into(%{})
        }
      }
      |> Jason.encode!()

    HTTPoison.post(
      "#{local_url()}/_replicate",
      payload,
      [{"Content-Type", "application/json"}],
      [
        timeout: @replication_timeout,
        recv_timeout: @replication_timeout
      ]
    )
  end

  defp headers() do
    headers(
      Application.get_env(:api, :couchdb_admin_name),
      Application.get_env(:api, :couchdb_admin_password)
    )
  end

  defp headers(user_name, user_password) do
    credentials =
      "#{user_name}:#{user_password}"
      |> Base.encode64()

    [
      {"Content-Type", "application/json"},
      {"Authorization", "Basic #{credentials}"}
    ]
  end

  defp local_url() do
    Application.get_env(:api, :couchdb_url)
  end

  defp source_url_fix(url) do
    # If we want to connect to FieldHub running at localhost:4000 in development
    # we have to use host.docker.internal as url for the FieldPublication CouchDB. This is
    # necessary because calling localhost within the container would otherwise resolve to the container itself.

    if @fix_source_url do
      String.replace(url, "localhost", "host.docker.internal")
    else
      url
    end
  end
end
