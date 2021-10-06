defmodule IdaiFieldServerWeb.FilesController do
  use IdaiFieldServerWeb, :controller

  import Plug.BasicAuth
  import IdaiFieldServer.Accounts

  @files_folder_name "files"
  @files_root "./#{@files_folder_name}"

  # { email, password } = Plug.BasicAuth.parse_basic_auth(conn)
  # p = IdaiFieldServer.Accounts.get_project_by_email_and_password(email, password)
  # IO.inspect p.email

  def index(conn, %{"project" => project}) do
    files =
      Path.wildcard("#{@files_root}/#{project}/*")
      |> Enum.map(fn filename -> String.replace(filename, "#{@files_folder_name}/#{project}/", "") end)

    json(conn, %{project: project, files: files})
  end

  def download(conn, _) do
    conn
    |> send_download({:file, "./README.md"})
  end

  def upload(%{ params: %{ "project" => project, "filepath" => filepath }} = conn, params) do

    if length(filepath) > 0 do
      fp = filepath |> Enum.reverse |> tl() |> Enum.reverse
      File.mkdir_p! "#{@files_root}/#{fp}"
    end

    filepath = Enum.join(filepath, "/")

    {:ok, body, conn} = Plug.Conn.read_body(conn)

    {:ok, file} = File.open "#{@files_root}/#{filepath}", [:write]
    IO.binwrite file, body
    File.close file

    json(conn, %{status: :ok})
  end

  def list_images(dir) do
    #if not File.dir?(dir) raise ""
    File.ls! dir
  end
end
