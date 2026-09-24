defmodule FieldHubWeb.DatabaseProxyTest do
  use FieldHubWeb.ConnCase

  test "connection through proxy plug can be established", %{conn: conn} do
    conn = get(conn, "/db")

    assert conn.status == 200

    assert %{
             "couchdb" => "Welcome",
             "vendor" => %{"name" => "The Apache Software Foundation"},
             "version" => "3.3.2"
           } = Jason.decode!(conn.resp_body)
  end
end
