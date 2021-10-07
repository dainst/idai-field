defmodule IdaiFieldServerWeb.FilesController do
  use IdaiFieldServerWeb, :controller

  import Plug.BasicAuth
  import IdaiFieldServer.Accounts
  alias IdaiFieldServer.Repo

  @files_folder_name "files"
  @files_root "./#{@files_folder_name}"

  def download %{ query_params: query_params} = conn, params do
    unless is_authorized? conn do
      json conn, %{ status: :unauthorized }
    else
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
  end

  def upload conn, _params do
    unless is_authorized? conn do
      json conn, %{ status: :unauthorized }
    else
      if File.exists?(get_filepath(conn)) do
        json conn, %{ status: :filexists }
      else
        put_file conn
        json conn, %{ status: :ok }
      end
    end
  end

  def delete conn, _params do
    unless is_authorized? conn do
      json conn, %{ status: :unauthorized }
    else
      filepath = get_filepath conn
      if File.exists?(filepath) and not File.dir?(filepath) do
        File.rm! filepath
        json conn, %{ status: :deleted }
      else
        json conn, %{ status: :notfound }
      end
    end
  end

  defp put_file %{ params: %{ "project" => project, "filepath" => segments }} = conn do
    if length(segments) > 0 do
      fp = segments |> Enum.reverse |> tl() |> Enum.reverse
      File.mkdir_p! "#{@files_root}/#{project}/#{fp}"
    end

    {:ok, body, conn} = Plug.Conn.read_body conn

    filepath = get_filepath conn
    {:ok, file} = File.open filepath, [:write]
    IO.binwrite file, body
    File.close file
  end

  defp get_filepath %{ params: %{ "project" => project, "filepath" => filepath }} do
    filepath_string = Enum.join filepath, "/"
    "#{@files_root}/#{project}/#{filepath_string}"
  end

  defp is_authorized? conn do
    project = get_project conn
    { user, password } = Plug.BasicAuth.parse_basic_auth(conn)
    couchdb_path = get_couchdb_path()

    options = [hackney: [basic_auth: {user, password}]]
    response = HTTPoison.get!(
      "http://#{couchdb_path}/#{project}" ,
      %{},
      options
    )
    result = Poison.decode! response.body

    is_nil result["error"]
  end

  defp get_couchdb_path do
    repo_env = Application.fetch_env! :idai_field_server, Repo
    repo_env = Enum.into repo_env, %{}
    repo_env.couchdb
  end

  defp get_project %{ params: %{ "project" => project }} do
    project
  end

  defp get_files dir do
    ls_r(dir)
    |> Enum.map(fn filename -> String.replace(filename, "./", "/") end)
  end

  # https://www.ryandaigle.com/a/recursively-list-files-in-elixir/
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
end
