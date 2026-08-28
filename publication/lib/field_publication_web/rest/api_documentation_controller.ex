defmodule FieldPublicationWeb.ApiDocControllerController do
  use FieldPublicationWeb, :controller

  def show(conn, _params) do
    conn =
      conn
      |> assign(:current_path, ~p"/api_doc")
      |> assign(:page_title, "API Documentation")

    render(conn)
  end
end
