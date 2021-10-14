defmodule IdaiFieldServerWeb.DatabasesController do
  use IdaiFieldServerWeb, :controller

  alias IdaiFieldServer.CouchdbDatastore

  def index(conn, _params) do

    databases = CouchdbDatastore.list_databases()
    render(conn, "index.html", error_message: nil, databases: databases)
  end
end
