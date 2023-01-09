defmodule FieldHubWeb.PageController do
  use FieldHubWeb, :controller

  alias FieldHub.CouchService

  def index(conn, _params) do
    conn =
      case conn do
        %{assigns: %{current_user: nil}} ->
          conn

        %{assigns: %{current_user: user}} ->
          projects = CouchService.get_databases_for_user(user)

          conn
          |> assign(:projects, projects)
      end

    render(conn, "index.html")
  end
end
