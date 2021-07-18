defmodule IdaiFieldServerWeb.FileSyncController do
  use IdaiFieldServerWeb, :controller

  import Plug.BasicAuth
  import IdaiFieldServer.Accounts

  def index(conn, %{"project" => project}) do

    { email, password } = Plug.BasicAuth.parse_basic_auth(conn)

    p = IdaiFieldServer.Accounts.get_project_by_email_and_password(email, password)
    IO.inspect p.email

    json(conn, %{project: project})
  end

  def list_images(dir) do 
    #if not File.dir?(dir) raise ""
    File.ls! dir
  end
end