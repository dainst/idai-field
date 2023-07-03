defmodule FieldPublication.CouchService do
  @fix_source_url Application.compile_env(:field_publication, :fix_couch_source_url, false)

  @system_databases ["_users", "_replicator"]
  @application_databases ["field_users"]

  # TODO: Should probably be defined by Api.Publication module
  @publication_suffix ~r".*_publication-\d{4}-\d{2}-\d{2}.*"

  @field_users_db Application.compile_env(:field_publication, :field_user_db)

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
      {_, %Finch.Response{status: status_code_user}},
      {_, %Finch.Response{status: status_code_replicator}}
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

    {_, %Finch.Response{status:  status_code_field_publication_users}} = create_database(@field_users_db)

    case status_code_field_publication_users do
      412 ->
        Logger.warning(
          "Application database '#{@field_users_db}' already exists. You probably ran the CouchDB setup on an existing instance."
        )

      code when 199 < code and code < 300 ->
        Logger.info("Created application database `#{@field_users_db}`.")
    end

    app_user = Application.get_env(:field_publication, :couchdb_user_name)

    create_user(
      app_user,
      Application.get_env(:field_publication, :couchdb_user_password)
    )
    |> then(fn {:ok, %Finch.Response{status: status_code}} -> status_code end)
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
    Finch.build(
      :put,
      "#{local_url()}/_users/org.couchdb.user:#{name}",
      headers(),
      Jason.encode!(%{name: name, password: password, roles: [], type: "user"})
    )
    |> Finch.request(FieldPublication.Finch)
  end

  @doc """
  Returns a list of all databases (excluding CouchDB's internal ones: `_users` and `_replicator`).
  """
  def get_project_databases() do
    Finch.build(
      :get,
      "#{local_url()}/_all_dbs",
      headers()
    )
    |> Finch.request(FieldPublication.Finch)
    |> case do
      {:ok, %Finch.Response{body: body, status: 200} = _response} ->
        body
        |> Jason.decode!()
        |> Stream.reject(fn name ->
          name in (@system_databases ++ @application_databases) or
            Regex.match?(@publication_suffix, name)
        end)
        |> Enum.to_list()
        |> Enum.sort()

      everything_else ->
        Logger.error(everything_else)
        []
    end
  end

  def create_database(name) do
    Finch.build(
      :put,
      "#{local_url()}/#{name}",
      headers()
    )
    |> Finch.request(FieldPublication.Finch)
  end

  def store_document(database_name, doc_id, document) do
    Finch.build(
      :put,
      "#{local_url()}/#{database_name}/#{doc_id}",
      headers(
        Application.get_env(:field_publication, :couchdb_user_name),
        Application.get_env(:field_publication, :couchdb_user_password)
      ),
      Jason.encode!(document)
    )
    |> Finch.request(FieldPublication.Finch)
  end

  def retrieve_document(database_name, doc_id) do
    Finch.build(
      :get,
      "#{local_url()}/#{database_name}/#{doc_id}",
      headers(
        Application.get_env(:field_publication, :couchdb_user_name),
        Application.get_env(:field_publication, :couchdb_user_password)
      )
    )
    |> Finch.request(FieldPublication.Finch)
  end

  def add_application_user(project_identifier) do
    Finch.build(
      :get,
      "#{local_url()}/#{project_identifier}/_security",
      headers()
    )
    |> Finch.request(FieldPublication.Finch)
    |> case do
      {:ok, %{body: body, status: 200}} ->
        %{"admins" => existing_admins, "members" => existing_members} = Jason.decode!(body)

        updated_names =
          (Map.get(existing_members, "names", []) ++
             [Application.get_env(:field_publication, :couchdb_user_name)])
          |> Enum.uniq()

        updated_payload =
          %{
            admins: existing_admins,
            members: %{
              names: updated_names,
              roles: existing_members["roles"]
            }
          }
          |> Jason.encode!()

        Finch.build(
          :put,
          "#{local_url()}/#{project_identifier}/_security",
          headers(),
          updated_payload
        )
        |> Finch.request(FieldPublication.Finch)

      {:ok, %{code: 404}} = res ->
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

    Finch.build(
      :post,
      "#{local_url()}/_replicate",
      [{"Content-Type", "application/json"}],
      payload
    )
    |> Finch.request(
      FieldPublication.Finch,
      pool_timeout: @replication_timeout,
      receive_timeout: @replication_timeout
    )
  end

  defp headers() do
    headers(
      Application.get_env(:field_publication, :couchdb_admin_name),
      Application.get_env(:field_publication, :couchdb_admin_password)
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
    Application.get_env(:field_publication, :couchdb_url)
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
