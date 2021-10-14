defmodule IdaiFieldServerWeb.DatabasesController do
  use IdaiFieldServerWeb, :controller

  alias IdaiFieldServer.CouchdbDatastore

  def index conn, _params do
    databases = CouchdbDatastore.list_databases()
    render(conn, "index.html", error_message: nil, databases: databases)
  end

  def new conn, _params do
    render(conn, "new.html", error_message: nil)
  end

  def edit conn, %{ "name" => name } = _params do
    render(conn, "edit.html", error_message: nil, name: name)
  end
end
