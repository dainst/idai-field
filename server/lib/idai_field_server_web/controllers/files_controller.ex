defmodule IdaiFieldServerWeb.FilesController do
  use IdaiFieldServerWeb, :controller

  import Plug.BasicAuth
  import IdaiFieldServer.Accounts

  @files_folder_name "files"
  @files_root "./#{@files_folder_name}"

  def download %{ query_params: query_params} = conn, params do

    { _email, _password } = Plug.BasicAuth.parse_basic_auth(conn)
    # IdaiFieldServer.Accounts.get_project_by_email_and_password(email, password)

    filepath = get_filepath conn

    if not File.exists? filepath do
      json conn, %{ status: :not_found, path: filepath }
    else
      if File.dir? filepath do
        json conn, %{ project: get_project(conn), files: get_files(filepath) }
      else
        send_download conn, {:file, filepath}
      end
    end
  end

  def upload %{ params: %{ "project" => project, "filepath" => filepath }} = conn, params do

    { _email, _password } = Plug.BasicAuth.parse_basic_auth(conn)
    # IdaiFieldServer.Accounts.get_project_by_email_and_password(email, password)

    if length(filepath) > 0 do
      fp = filepath |> Enum.reverse |> tl() |> Enum.reverse
      File.mkdir_p! "#{@files_root}/#{project}/#{fp}"
    end

    filepath = Enum.join filepath, "/"

    {:ok, body, conn} = Plug.Conn.read_body conn

    {:ok, file} = File.open "#{@files_root}/#{project}/#{filepath}", [:write]
    IO.binwrite file, body
    File.close file

    json conn, %{ status: :ok }
  end

  def delete conn, params do

    { _email, _password } = Plug.BasicAuth.parse_basic_auth(conn)
    # IdaiFieldServer.Accounts.get_project_by_email_and_password(email, password)

    filepath = get_filepath conn

    if File.exists?(filepath) and not File.dir?(filepath) do
      File.rm! filepath
      json conn, %{ status: :deleted }
    else
      json conn, %{ status: :notfound }
    end
  end

  defp get_filepath %{ params: %{ "project" => project, "filepath" => filepath }} do
    filepath_string = Enum.join filepath, "/"
    "#{@files_root}/#{project}/#{filepath_string}"
  end

  defp get_project %{ params: %{ "project" => project }} do
    project
  end

  defp get_files dir do
    ls_r(dir)
    |> Enum.map(fn filename -> String.replace(filename, "./", "/") end)
    # Path.wildcard("#{dir}/*")
  end

  # thx Ryan Daigle, https://www.ryandaigle.com/a/recursively-list-files-in-elixir/
  defp ls_r(path \\ ".") do
    cond do
      File.regular?(path) -> [path]
      File.dir?(path) ->
        File.ls!(path)
        |> Enum.map(&Path.join(path, &1))
        |> Enum.map(&ls_r/1)
        |> Enum.concat
      true -> []
    end
  end

  # TODO remove
  def list_images dir do
    #if not File.dir?(dir) raise ""
    File.ls! dir
  end
end
