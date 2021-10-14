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

  def delete conn, %{ "database" => %{
      "admin_password" => password,
      "name" => name
    }} do

    if CouchdbDatastore.authorize("admin", password) do

      CouchdbDatastore.delete_database name
      answer = CouchdbDatastore.delete_user name

      conn
      |> put_flash(:info, "Database deleted successfully.")
      |> redirect(to: Routes.databases_path(conn, :index))
    else
      conn = conn |> put_flash(:error, "Wrong password given.")
      render(conn, "edit.html", name: name)
    end
  end

  def create conn, %{ "database" =>
      %{
        "database_name" => name,
        "main_db_user_password" => password,
        "main_db_user_password_confirmation" => password_confirmation
      }} do

    if password != password_confirmation do
      conn = conn |> put_flash(:error, "passwords do not match")
      render conn, "new.html"
    else
      CouchdbDatastore.create_database name
      CouchdbDatastore.create_user name, password
      CouchdbDatastore.set_permissions name

      conn
      |> put_flash(:info, "Database created successfully.")
      |> redirect(to: Routes.databases_path(conn, :index))
    end
  end

  def edit conn, %{ "name" => name } = _params do
    render(conn, "edit.html", error_message: nil, name: name)
  end
end
