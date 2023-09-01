defmodule FieldPublication.CouchService do
  @system_databases ["_users", "_replicator"]
  @application_databases ["field_users"]

  # TODO: Should probably be defined by Api.Publication module
  @publication_suffix ~r".*_publication-\d{4}-\d{2}-\d{2}.*"

  @core_database Application.compile_env(:field_publication, :core_database)

  require Logger

  @doc """
  Creates CouchDB's internal databases `_users` and `_replicator` and the applications main database.

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

    {_, %Finch.Response{status:  status_code_core_database}} = create_database(@core_database)

    case status_code_core_database do
      412 ->
        Logger.warning(
          "Application database '#{@core_database}' already exists. You probably ran the CouchDB setup on an existing instance."
        )

      code when 199 < code and code < 300 ->
        Logger.info("Created application database `#{@core_database}`.")
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

    add_application_user(@core_database)
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

  def find_documents(%{type: type}, database_name \\ @core_database) do
    Finch.build(
      :post,
      "#{local_url()}/#{database_name}/_find",
      headers(),
      %{ selector: %{ doc_type: type } }
      |> Jason.encode!()
    )
    |> Finch.request(FieldPublication.Finch)
  end

  def create_database(name) do
    Finch.build(
      :put,
      "#{local_url()}/#{name}",
      headers()
    )
    |> Finch.request(FieldPublication.Finch)
  end

  def delete_database(name) do
    Finch.build(
      :delete,
      "#{local_url()}/#{name}",
      headers()
    )
    |> Finch.request(FieldPublication.Finch)
  end

  def store_document(doc_id, document, database_name \\ @core_database) do
    Finch.build(
      :put,
      "#{local_url()}/#{database_name}/#{doc_id}",
      headers(),
      Jason.encode!(document)
    )
    |> Finch.request(FieldPublication.Finch)
  end

  def retrieve_document(doc_id, database_name \\ @core_database) do
    Finch.build(
      :get,
      "#{local_url()}/#{database_name}/#{doc_id}",
      headers()
    )
    |> Finch.request(FieldPublication.Finch)
  end

  def delete_document(%{"_id" => id, "_rev" => rev}, database_name \\ @core_database) do
    Finch.build(
      :delete,
      "#{local_url()}/#{database_name}/#{id}?rev=#{rev}",
      headers()
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

  def headers() do
    headers(
      Application.get_env(:field_publication, :couchdb_admin_name),
      Application.get_env(:field_publication, :couchdb_admin_password)
    )
  end

  def headers(user_name, user_password) do
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
end
