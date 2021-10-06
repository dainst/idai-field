defmodule IdaiFieldServerWeb.FilesController do
  use IdaiFieldServerWeb, :controller

  import Plug.BasicAuth
  import IdaiFieldServer.Accounts

  # { email, password } = Plug.BasicAuth.parse_basic_auth(conn)
  # p = IdaiFieldServer.Accounts.get_project_by_email_and_password(email, password)
  # IO.inspect p.email

  def index(conn, %{"project" => project}) do
    files =
      Path.wildcard("./files/#{project}/*")
      |> Enum.map(fn filename -> String.replace(filename, "files/#{project}/", "") end)

    json(conn, %{project: project, files: files})
  end

  def download(conn, _) do
    conn
    |> send_download({:file, "./README.md"})
  end

  def list_images(dir) do
    #if not File.dir?(dir) raise ""
    File.ls! dir
  end
end
