defmodule IdaiFieldServer.CouchdbConnection do

  alias IdaiFieldServer.Repo

  def anon_post url, data do # TODO reuse_admin_post_put
    couchdb_path = get_couchdb_path()
    password = get_password()
    headers = [{"Content-type", "application/json"}]
    options = []
    body = Poison.encode! data
    url = "http://#{couchdb_path}/#{url}"
    {:ok, response} = HTTPoison.post url, body, headers, options
    Poison.decode! response.body
  end

  def admin_post url, data do
    admin_post_put &HTTPoison.post/4, url, data
  end

  def admin_put url, data do
    admin_post_put &HTTPoison.put/4, url, data
  end

  def admin_post_put method, url, data do # TODO make private
    couchdb_path = get_couchdb_path()
    password = get_password()
    headers = [{"Content-type", "application/json"}]
    options = [hackney: [basic_auth: {"admin", password}]]
    body = Poison.encode! data
    url = "http://#{couchdb_path}/#{url}"
    {:ok, response} = method.(url, body, headers, options)
    Poison.decode! response.body
  end

  def admin_delete url do
    couchdb_path = get_couchdb_path()
    password = get_password()
    options = [hackney: [basic_auth: {"admin", password}]]
    url = "http://#{couchdb_path}/#{url}"
    {:ok, response} = HTTPoison.delete url, %{}, options
  end

  def admin_get url do
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
