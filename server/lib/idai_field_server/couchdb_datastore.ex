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

  # TODO dedup, see files_controller
  defp get_couchdb_path do
    repo_env = Application.fetch_env! :idai_field_server, Repo
    repo_env = Enum.into repo_env, %{}
    repo_env.couchdb
  end
end
