defmodule Api.Auth.ReadableProjectsPlug do
  import Plug.Conn
  import Api.RouterUtils, only: [get_user: 1]

  def init(options), do: options

  def call(conn, _opts) do
    conn
    |> put_private(:readable_projects, get_user(conn).readable_projects)
  end
end
