defmodule IdaiFieldServer.CouchdbDatastore do

  alias IdaiFieldServer.Repo

  # Returns a user if name and password can be successfully used
  # to instantiate a session with the couchdb's _session endpoint,
  # and `nil`, if not successful.
  def authorize name, password do
    couchdb_path = get_couchdb_path()

    headers = [{"Content-type", "application/json"}]

    {:ok, response} = HTTPoison.post(
      "http://#{couchdb_path}/_session" ,
      Poison.encode!(%{ name: name, password: password }),
      headers,
      []
    )
    answer = Poison.decode! response.body

    if is_nil(answer["error"]), do: %{ name: name, id: "org.couchdb.user:#{name}" }
  end

  def change_password new_pwd, old_pwd do
    false
  end

  def store_token user_id, token do

    couchdb_path = get_couchdb_path()
    password = get_password()

    options = [hackney: [basic_auth: {"admin", password}]]
    headers = [{"Content-type", "application/json"}]
    {:ok, response} = HTTPoison.post(
      "http://#{couchdb_path}/user-tokens" ,
      Poison.encode!(%{ user_id: user_id, _id: token }),
      headers,
      options
    )
    # TODO handle errors
  end

  def retrieve_user_by token do

    couchdb_path = get_couchdb_path()
    password = get_password()

    encoded_token = :http_uri.encode token

    options = [hackney: [basic_auth: {"admin", password}]]
    {:ok, response} = HTTPoison.get(
      "http://#{couchdb_path}/user-tokens/#{encoded_token}",
      %{},
      options
    )
    answer = Poison.decode!(response.body)
    if not is_nil(answer["user_id"]) do
      # TODO review
      %{
        email: "a@b.c",
        name: String.replace(answer["user_id"], "org.couchdb.user:", ""),
        id: answer["_id"]
      }
    end
  end

  # TODO handle errors
  def delete_session_token token do

    couchdb_path = get_couchdb_path()
    password = get_password()
    encoded_token = :http_uri.encode token
    options = [hackney: [basic_auth: {"admin", password}]]

    {:ok, response} = HTTPoison.get(
      "http://#{couchdb_path}/user-tokens/#{encoded_token}",
      %{},
      options
    )
    rev = Poison.decode!(response.body)["_rev"]

    {:ok, response} = HTTPoison.delete(
      "http://#{couchdb_path}/user-tokens/#{encoded_token}?rev=#{rev}",
      %{},
      options
    )
  end

  defp get_password do
    repo_env = Application.fetch_env! :idai_field_server, Repo
    repo_env = Enum.into repo_env, %{}
    repo_env.password
  end

  # TODO dedup, see files_controller
  defp get_couchdb_path do
    repo_env = Application.fetch_env! :idai_field_server, Repo
    repo_env = Enum.into repo_env, %{}
    repo_env.couchdb
  end
end
