defmodule IdaiFieldServer.CouchdbConnection do

  alias IdaiFieldServer.Repo

  def anon_post url, data do
    post_put &HTTPoison.post/4, url, data, false
  end

  def admin_post url, data do
    post_put &HTTPoison.post/4, url, data, true
  end

  def admin_put url, data do
    post_put &HTTPoison.put/4, url, data, true
  end

  def admin_delete url do
    url = get_couchdb_path url
    password = get_password()
    options = [hackney: [basic_auth: {"admin", password}]]
    {:ok, response} = HTTPoison.delete url, %{}, options
  end

  def admin_get url do
    url = get_couchdb_path url
    password = get_password()
    options = [hackney: [basic_auth: {"admin", password}]]
    {:ok, response} = HTTPoison.get url, %{}, options
    Poison.decode! response.body
  end

  defp post_put method, url, data, as_admin do
    url = get_couchdb_path url
    password = get_password()
    headers = [{"Content-type", "application/json"}]
    options = if as_admin do [hackney: [basic_auth: {"admin", password}]] else [] end
    body = Poison.encode! data
    {:ok, response} = method.(url, body, headers, options)
    Poison.decode! response.body
  end

  defp get_password do
    repo_env = Application.fetch_env! :idai_field_server, Repo
    repo_env = Enum.into repo_env, %{}
    repo_env.password
  end

  # TODO dedup, see files_controller
  defp get_couchdb_path url do
    repo_env = Application.fetch_env! :idai_field_server, Repo
    repo_env = Enum.into repo_env, %{}
    "http://#{repo_env.couchdb}/#{url}"
  end
end
