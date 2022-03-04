defmodule FieldHubWeb.PageControllerTest do
  use FieldHubWeb.ConnCase

  test "GET /", %{conn: conn} do
    conn = get(conn, "/")
    assert html_response(conn, 200) =~ "FieldHub"
  end
end
