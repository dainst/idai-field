defmodule FieldHubWeb.DatabaseProxyTest do
  use FieldHubWeb.ConnCase

  test "connection threw proxy plug can be established", %{conn: conn} do
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
             "version" => "3.2.1"
           } = response
  end
end
