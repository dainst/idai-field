defmodule FieldHubWeb.PageController do
  use FieldHubWeb, :controller

  alias FieldHub.CouchService

  def index(conn, _params) do
    conn =
      case conn do
        %{assigns: %{current_user: user}} ->
          projects = CouchService.get_databases_for_user(user)

          conn
          |> assign(:projects, projects)
          |> IO.inspect()

        _ ->
          conn
      end

    render(conn, "index.html")
  end
end
