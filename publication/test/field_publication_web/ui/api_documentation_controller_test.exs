defmodule FieldPublicationWeb.UI.ApiDocControllerTest do
  use FieldPublicationWeb.ConnCase

  test "swagger API renders properly", %{conn: conn} do
    assert conn
           |> get(~p"/api_doc")
           |> html_response(200)
  end

  test "swagger API spec renders properly", %{conn: conn} do
    assert conn
           |> get(~p"/api/spec")
           |> json_response(200)
  end
end
