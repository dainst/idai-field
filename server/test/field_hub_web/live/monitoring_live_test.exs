defmodule FieldHubWeb.MonitoringLiveTest do
  import Plug.Conn
  import Phoenix.ConnTest
  import Phoenix.LiveViewTest

  use FieldHubWeb.{
    ConnCase
  }

  alias FieldHub.{
    TestHelper
  }

  @endpoint FieldHubWeb.Endpoint

  @project "test_project"
  @user_name "test_user"
  @user_password "test_password"

  setup_all %{} do

    TestHelper.clear_authentication_token_cache()

    # Run before each tests
    TestHelper.create_complete_example_project(@project, @user_name, @user_password)

    on_exit(fn ->
      # Run after each tests
      TestHelper.remove_complete_example_project(
        @project,
        @user_name
      )
    end)
  end

  test "redirect to login if not authenticated", %{conn: conn} do
    conn = get(conn, "/ui/monitoring/#{@project}")

    assert "/ui/session/new" = redirected_to(conn, 302)
  end

  test "redirect to landing page if not authorized", %{conn: conn} do
    conn =
      conn
      |> log_in_user("nope")
      |> get("/ui/monitoring/#{@project}")

    assert "/" = redirected_to(conn, 302)
  end

  test "redirect to landing page if non existing project", %{conn: conn} do
    conn =
      conn
      |> log_in_user("nope")
      |> get("/ui/monitoring/nope")

    assert "/" = redirected_to(conn, 302)
  end


  describe "with logged in user" do
    setup %{conn: conn} do

      conn = log_in_user(conn, @user_name)

      {:ok, %{conn: conn}}
    end

    test "authorized user loads monitoring page", %{conn: conn} do
      conn =
        conn
        |> get("/ui/monitoring/#{@project}")

      assert conn.status == 200
      assert conn.resp_body =~ "<h1>Project <i>#{@project}</i></h1>"
    end
  end
end
