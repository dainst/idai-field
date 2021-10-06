defmodule IdaiFieldServerWeb.FilesController do
  use IdaiFieldServerWeb, :controller

  import Plug.BasicAuth
  import IdaiFieldServer.Accounts

  @files_folder_name "files"
  @files_root "./#{@files_folder_name}"

  # { email, password } = Plug.BasicAuth.parse_basic_auth(conn)
  # p = IdaiFieldServer.Accounts.get_project_by_email_and_password(email, password)
  # IO.inspect p.email

  def download %{
      query_params: query_params,
      params: %{
        "project" => project,
        "filepath" => filepath
      }} = conn, params do

    filepath_string = Enum.join filepath, "/"
    complete_filepath = "#{@files_root}/#{project}/#{filepath_string}"

    if not File.exists? complete_filepath do
      json conn, %{ status: :not_found, path: complete_filepath }
    else
      if File.dir? complete_filepath do
        json conn, %{ project: project, files: get_files(complete_filepath) }
      else
        send_download conn, {:file, complete_filepath}
      end
    end
  end

  def upload %{ params: %{ "project" => project, "filepath" => filepath }} = conn, params do

    if length(filepath) > 0 do
      fp = filepath |> Enum.reverse |> tl() |> Enum.reverse
      File.mkdir_p! "#{@files_root}/#{project}/#{fp}"
    end

    filepath = Enum.join filepath, "/"

    {:ok, body, conn} = Plug.Conn.read_body conn

    {:ok, file} = File.open "#{@files_root}/#{project}/#{filepath}", [:write]
    IO.binwrite file, body
    File.close file

    json conn, %{status: :ok}
  end

  defp get_files dir do
    Path.wildcard("#{dir}/*")
    |> Enum.map(fn filename -> "/" <> filename end)
  end

  # TODO remove
  def list_images dir do
    #if not File.dir?(dir) raise ""
    File.ls! dir
  end
end
