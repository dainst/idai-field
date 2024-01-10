defmodule FieldPublication.CouchService do
  @core_database Application.compile_env(:field_publication, :core_database)

  require Logger

  @doc """
  Creates CouchDB's internal databases `_users` and `_replicator` and the application's core database.
  """
  def initial_setup() do
    [
      {_, %Finch.Response{status: status_code_user}},
      {_, %Finch.Response{status: status_code_replicator}}
    ] = Enum.map(["_users", "_replicator"], &put_database/1)

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

    {_, %Finch.Response{status: status_code_core_database}} = put_database(@core_database)

    case status_code_core_database do
      412 ->
        Logger.warning(
          "Application database '#{@core_database}' already exists. You probably ran the CouchDB setup on an existing instance."
        )

      code when 199 < code and code < 300 ->
        Logger.info("Created application database `#{@core_database}`.")
    end
  end

  @doc """
  Authenticate with credentials.

  Returns {:ok, :authenticated} if credentials are valid, otherwise `{:error, reason}`.

  __Parameters__
  - `name` the user's name.
  - `password` the user's password.
  """
  def authenticate(name, password) do
    Finch.build(
      :head,
      "#{local_url()}/",
      headers(name, password)
    )
    |> Finch.request(FieldPublication.Finch)
    |> case do
      {:ok, %{status: 200}} ->
        {:ok, :authenticated}

      {:ok, %{status: 401}} ->
        {:error, :unauthorized}
    end
  end

  @doc """
  List all CouchDB user documents

  Returns `{:ok, Finch.Response.t()}` or `{:error, Exception.t()}` for the list attempt. See the https://docs.couchdb.org/en/stable/api/server/authn.html for possible responses.
  """
  def list_users() do
    Finch.build(
      :get,
      "#{local_url()}/_users/_all_docs",
      headers()
    )
    |> Finch.request(FieldPublication.Finch)
  end

  @doc """
  Return the specified user's CouchDB document

  Returns `{:ok, Finch.Response.t()}` or `{:error, Exception.t()}` for the list attempt. See the https://docs.couchdb.org/en/stable/api/server/authn.html for possible responses.

  __Parameters__
  - `user_name` the user's name.
  """
  def get_user(name) do
    Finch.build(
      :get,
      "#{local_url()}/_users/org.couchdb.user:#{name}",
      headers()
    )
    |> Finch.request(FieldPublication.Finch)
  end

  @doc """
  Creates a CouchDB user.

  Returns `{:ok, Finch.Response.t()}` or `{:error, Exception.t()}` for the creation attempt. See the https://docs.couchdb.org for possible responses.

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
  Deletes a CouchDB user.

  Returns `{:ok, Finch.Response.t()}` or `{:error, Exception.t()}` for the deletion attempt. See the https://docs.couchdb.org for possible responses.

  __Parameters__
  - `name` the user's name.
  """
  def delete_user(name) do
    Finch.build(
      :get,
      "#{local_url()}/_users/org.couchdb.user:#{name}",
      headers()
    )
    |> Finch.request(FieldPublication.Finch)
    |> case do
      {:ok, %{status: 200, body: body}} ->
        %{"_rev" => rev} =
          body
          |> Jason.decode!()

        Finch.build(
          :delete,
          "#{local_url()}/_users/org.couchdb.user:#{name}",
          headers() ++ [{"If-Match", rev}]
        )
        |> Finch.request(FieldPublication.Finch)

      {:ok, %{status: 404}} = response ->
        # User was not found
        response
    end
  end

  @doc """
  Sets the password for an existing CouchDB user`.

  Returns `{:ok, Finch.Response.t()}` or `{:error, Exception.t()}` for the update attempt. See the https://docs.couchdb.org for possible responses.

  __Parameters__
  - `name` the user's name.
  - `new_password` the user's new password.
  """
  def update_password(name, new_password) do
    response =
      Finch.build(
        :get,
        "#{local_url()}/_users/org.couchdb.user:#{name}",
        headers()
      )
      |> Finch.request(FieldPublication.Finch)

    case response do
      {:ok, %{status: 200, body: body}} ->
        body
        |> Jason.decode!()
        |> case do
          %{"_rev" => rev} ->
            Finch.build(
              :put,
              "#{local_url()}/_users/org.couchdb.user:#{name}",
              headers() ++ [{"If-Match", rev}],
              Jason.encode!(%{name: name, password: new_password, roles: [], type: "user"})
            )
            |> Finch.request(FieldPublication.Finch)
        end

      {:ok, %{status: 404}} = res ->
        res
    end
  end

  @doc """
  Search for documents in the CouchDB instance.

  Returns a Elixir `Stream` (lazy enumerable) that can be used to pull all documents that match a query. See also
  https://docs.couchdb.org/en/stable/api/database/find.html.

  __Parameters__
  - `query`, a `Map` describing a valid Mango query.
  - `database` (optional), name of the database to query.
  """
  def get_document_stream(query, database \\ @core_database)
      when is_map(query) and is_binary(database) do
    batch_size = 500

    Stream.resource(
      fn ->
        query
        |> Map.put(:limit, batch_size)
      end,
      fn payload ->
        Finch.build(
          :post,
          "#{local_url()}/#{database}/_find",
          headers(),
          Jason.encode!(payload)
        )
        |> Finch.request(FieldPublication.Finch)
        |> case do
          {:ok, %{status: 200, body: body}} ->
            body
            |> Jason.decode!()
            |> case do
              %{"docs" => []} ->
                {:halt, :ok}

              %{"docs" => docs, "bookmark" => bookmark} ->
                {
                  docs,
                  Map.put(payload, :bookmark, bookmark)
                }
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
  Put a new database.

  Returns `{:ok, Finch.Response.t()}` or `{:error, Exception.t()}` for the put attempt. See the https://docs.couchdb.org for possible responses.

  __Parameters__
  - `name`, the new database's name
  """
  def put_database(name) do
    Finch.build(
      :put,
      "#{local_url()}/#{name}",
      headers()
    )
    |> Finch.request(FieldPublication.Finch)
  end

  @doc """
  Delete a database.

  Returns `{:ok, Finch.Response.t()}` or `{:error, Exception.t()}` for the deletion attempt. See the https://docs.couchdb.org for possible responses.

  __Parameters__
  - `name`, the database's name
  """
  def delete_database(name) do
    Finch.build(
      :delete,
      "#{local_url()}/#{name}",
      headers()
    )
    |> Finch.request(FieldPublication.Finch)
  end

  @doc """
  Get a specific document

  Returns `{:ok, Finch.Response.t()}` or `{:error, Exception.t()}` for the deletion attempt. See the https://docs.couchdb.org for possible responses.

  __Parameters__
  - `doc_id`, the document's id.
  - `database_name` (optional), the document's database.
  """
  def get_document(doc_id, database_name \\ @core_database) do
    Finch.build(
      :get,
      "#{local_url()}/#{database_name}/#{doc_id}",
      headers()
    )
    |> Finch.request(FieldPublication.Finch)
  end

  @doc """
  Post a document

  Returns `{:ok, Finch.Response.t()}` or `{:error, Exception.t()}` for the post attempt. See the https://docs.couchdb.org for possible responses.

  __Parameters__
  - `doc`, the document that should be added to the database.
  - `database_name` (optional), the document's database.
  """
  def post_document(doc, database_name \\ @core_database) do
    Finch.build(
      :post,
      "#{local_url()}/#{database_name}",
      headers(),
      Jason.encode!(doc)
    )
    |> Finch.request(FieldPublication.Finch)
  end

  @doc """
  Put a document

  Returns `{:ok, Finch.Response.t()}` or `{:error, Exception.t()}` for the put attempt. See the https://docs.couchdb.org for possible responses.

  __Parameters__
  - `id`, the document's id.
  - `doc`, the updated document.
  - `database_name` (optional), the document's database.
  """
  def put_document(id, doc, database_name \\ @core_database) do
    Finch.build(
      :put,
      "#{local_url()}/#{database_name}/#{id}",
      headers(),
      Jason.encode!(doc)
    )
    |> Finch.request(FieldPublication.Finch)
  end

  @doc """
  Delete a document

  Returns `{:ok, Finch.Response.t()}` or `{:error, Exception.t()}` for the deletion attempt. See the https://docs.couchdb.org for possible responses.

  __Parameters__
  - `id`, the document's id.
  - `rev`, the document's revision.
  - `database_name` (optional), the document's database.
  """
  def delete_document(id, rev, database_name \\ @core_database) do
    Finch.build(
      :delete,
      "#{local_url()}/#{database_name}/#{id}?rev=#{rev}",
      headers()
    )
    |> Finch.request(FieldPublication.Finch)
  end

  @doc """
  Get the default headers used in CouchDB queries:
  "Content-Type: application/json" and the base64 encoded admin credentials.
  """
  def headers() do
    headers(
      Application.get_env(:field_publication, :couchdb_admin_name),
      Application.get_env(:field_publication, :couchdb_admin_password)
    )
  end

  @doc """
  Get the headers used in CouchDB queries:
  "Content-Type: application/json" and the base64 encoded credentials.

  __Parameters__
  - `user_name`, the user name to be base64 encoded.
  - `user_password`, the user password to be base64 encoded.
  """
  def headers(user_name, user_password) do
    credentials =
      "#{user_name}:#{user_password}"
      |> Base.encode64()

    [
      {"Content-Type", "application/json"},
      {"Authorization", "Basic #{credentials}"}
    ]
  end

  def generate_password(length \\ 32) do
    length
    |> :crypto.strong_rand_bytes()
    |> Base.encode64()
    |> binary_part(0, length)
  end

  defp local_url() do
    Application.get_env(:field_publication, :couchdb_url)
  end
end
