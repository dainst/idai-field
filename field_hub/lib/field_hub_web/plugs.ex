defmodule FieldHubWeb.Plugs do
  import Plug.Conn

  alias FieldHub.CouchService.Credentials

  def api_auth(%{params: %{"project" => project}} = conn, _) do

    with {name, password} <- Plug.BasicAuth.parse_basic_auth(conn),
      :ok <- FieldHub.CouchService.authenticate(project, %Credentials{name: name, password: password}) do
        assign(conn, :current_user, name)
      else
        _ ->
          conn
          |> Plug.BasicAuth.request_basic_auth()
          |> halt()
      end
  end
end
