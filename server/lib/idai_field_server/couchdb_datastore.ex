defmodule IdaiFieldServer.CouchdbDatastore do

  alias IdaiFieldServer.Repo

  # Returns a user if name and password can be successfully used
  # to instantiate a session with the couchdb's _session endpoint,
  # and `nil`, if not successful.
  def authorize name, password do
    couchdb_path = get_couchdb_path()

    url = "http://#{couchdb_path}/_session"
    body = Poison.encode!(%{ name: name, password: password })
    headers = [{"Content-type", "application/json"}]
    options = []

    {:ok, response} = HTTPoison.post url, body, headers, options
    answer = Poison.decode! response.body

    if is_nil(answer["error"]), do: %{ name: name }
  end

  def change_password name, password do
    answer = admin_get "_users/org.couchdb.user:#{name}"
    admin_put "_users/org.couchdb.user:#{name}?rev=#{answer["_rev"]}",
      %{ "name" => name, "password" => password, "roles" => [], "type" => "user"}
  end

  def store_token id, data do

    couchdb_path = get_couchdb_path()
    password = get_password()

    url = "http://#{couchdb_path}/user-tokens"
    body = Poison.encode!(Map.merge(%{ "_id": id }, data))
    options = [hackney: [basic_auth: {"admin", password}]]
    headers = [{"Content-type", "application/json"}]
    {:ok, response} = HTTPoison.post url, body, headers, options
    # TODO handle errors
  end

  def retrieve_user_by token do

    encoded_token = :http_uri.encode token
    answer = admin_get "/user-tokens/#{encoded_token}"

    if not is_nil(answer["name"]) do
      # TODO review
      %{
        # email: "a@b.c",
        # name: String.replace(answer["user_id"], "org.couchdb.user:", ""),
        name: answer["name"],
        id: answer["_id"]
      }
    end
  end

  # TODO handle errors
  def delete_session_token token do
    encoded_token = :http_uri.encode token
    answer = admin_get "user-tokens/#{encoded_token}"
    admin_delete "user-tokens/#{encoded_token}?rev=#{answer["_rev"]}"
  end

  defp admin_post url, data do
    admin_post_put &HTTPoison.post/4, url, data
  end

  defp admin_put url, data do
    admin_post_put &HTTPoison.put/4, url, data
  end

  defp admin_delete url do
    couchdb_path = get_couchdb_path()
    password = get_password()
    options = [hackney: [basic_auth: {"admin", password}]]
    url = "http://#{couchdb_path}/#{url}"
    {:ok, response} = HTTPoison.delete url, %{}, options
  end

  defp admin_post_put method, url, data do
    couchdb_path = get_couchdb_path()
    password = get_password()
    headers = [{"Content-type", "application/json"}]
    options = [hackney: [basic_auth: {"admin", password}]]
    body = Poison.encode! data
    url = "http://#{couchdb_path}/#{url}"
    {:ok, response} = method.(url, body, headers, options)
    Poison.decode! response.body
  end

  defp admin_get url do
    couchdb_path = get_couchdb_path()
    password = get_password()

    url = "http://#{couchdb_path}/#{url}"
    options = [hackney: [basic_auth: {"admin", password}]]
    {:ok, response} = HTTPoison.get url, %{}, options
    Poison.decode! response.body
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
