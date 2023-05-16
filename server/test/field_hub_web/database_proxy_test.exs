defmodule FieldHubWeb.DatabaseProxyTest do
  use FieldHubWeb.ConnCase

  test "connection through proxy plug can be established", %{conn: conn} do
    conn =
      conn
      |> get("/db")

    assert conn.status == 200

    response =
      conn.resp_body
      |> Jason.decode!()

    assert %{
             "couchdb" => "Welcome",
             "vendor" => %{"name" => "The Apache Software Foundation"},
             "version" => "3.3.2"
           } = response
  end
end
