defmodule FieldPublicationWeb.ConnCase do
  @moduledoc """
  This module defines the test case to be used by
  tests that require setting up a connection.

  Such tests rely on `Phoenix.ConnTest` and also
  import other functionality to make it easier
  to build common data structures and query the data layer.
  """

  @admin_name Application.compile_env(:field_publication, :couchdb_admin_name)
  @admin_password Application.compile_env(:field_publication, :couchdb_admin_password)

  use ExUnit.CaseTemplate

  using do
    quote do
      # The default endpoint for testing
      @endpoint FieldPublicationWeb.Endpoint

      use FieldPublicationWeb, :verified_routes

      # Import conveniences for testing with connections
      import Plug.Conn
      import Phoenix.ConnTest
      import FieldPublicationWeb.ConnCase
    end
  end

  setup _tags do
    {:ok, conn: Phoenix.ConnTest.build_conn()}
  end

  def log_in_user(conn, user) do
    token = FieldPublicationWeb.UserAuth.generate_user_session_token(user)

    conn
    |> Phoenix.ConnTest.init_test_session(%{})
    |> FieldPublicationWeb.UserAuth.put_token_in_session(token)
  end

  def add_admin_basic_auth(conn) do
    Plug.Conn.put_req_header(
      conn,
      "authorization",
      basic_auth(@admin_name, @admin_password)
    )
  end

  def add_basic_auth(conn, user, password) do
    Plug.Conn.put_req_header(
      conn,
      "authorization",
      basic_auth(user, password)
    )
  end

  defp basic_auth(user, password), do: "Basic " <> Base.encode64("#{user}:#{password}")
end
