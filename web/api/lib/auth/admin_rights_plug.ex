defmodule Api.Auth.AdminRightsPlug do
  import Plug.Conn
  import Api.RouterUtils, only: [send_unauthorized: 1, get_user: 1]

  def init(options), do: options

  def call(conn, _opts) do
    if not get_user(conn).is_admin do
      conn
      |> send_unauthorized
      |> halt
    else
      conn
    end
  end
end
