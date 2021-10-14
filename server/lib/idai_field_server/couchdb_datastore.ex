defmodule IdaiFieldServer.CouchdbDatastore do

  import IdaiFieldServer.CouchdbConnection

  # Returns a user if name and password can be successfully used
  # to instantiate a session with the couchdb's _session endpoint,
  # and `nil`, if not successful.
  def authorize name, password do
    answer = anon_post "_session", %{ name: name, password: password }
    if is_nil(answer["error"]), do: %{ name: name }
  end

  def change_password name, password do
    answer = admin_get "_users/org.couchdb.user:#{name}"
    admin_put "_users/org.couchdb.user:#{name}?rev=#{answer["_rev"]}",
      %{ "name" => name, "password" => password, "roles" => [], "type" => "user"}
  end

  def store_token id, data do
    admin_post "user-tokens", Map.merge(%{ "_id": id }, data)
  end

  def retrieve_user_by token do
    encoded_token = :http_uri.encode token
    answer = admin_get "/user-tokens/#{encoded_token}"
    if not is_nil(answer["name"]) do
      %{
        name: answer["name"],
        id: answer["_id"]
      }
    end
  end

  def set_permissions name do
    admin_put "#{name}/_security", %{
      admins: %{ names:  [name], roles: ["_admin"] },
      members: %{ names: [], roles: ["_admin"] }
    }
  end

  def create_user name, password do
    admin_put "_users/org.couchdb.user:#{name}", %{
      _id: "org.couchdb.user:#{name}",
      name: name,
      type: "user",
      roles: [],
      password: password
    }
  end

  def create_database name do
    admin_put name, %{}
  end

  def list_databases do
    dbs = admin_get "_all_dbs"
    dbs -- ["_replicator", "_users", "user-tokens"]
  end

  def delete_session_token token do
    encoded_token = :http_uri.encode token
    answer = admin_get "user-tokens/#{encoded_token}"
    admin_delete "user-tokens/#{encoded_token}?rev=#{answer["_rev"]}"
  end
end
