defmodule FieldHubWeb.UserSessionControllerTest do
  use FieldHubWeb.ConnCase

  use FieldHubWeb, :verified_routes

  alias FieldHub.TestHelper
  alias FieldHubWeb.UserAuth

  @project "test_project"
  @user_name "test_user"
  @user_password "test_password"

  setup_all %{} do
    TestHelper.create_test_db_and_user(@project, @user_name, @user_password)

    on_exit(fn ->
      TestHelper.remove_test_db_and_user(@project, @user_name)
    end)
  end

  test "GET /ui/session/log_in", %{conn: conn} do
    conn = get(conn, ~p"/ui/session/log_in")
    assert html_response(conn, 200) =~ "Log in"
  end

  test "login with valid credentials", %{conn: conn} do
    conn = get(conn, ~p"/ui/session/log_in")

    assert html_response(conn, 200) =~ "Log in"
    assert not (html_response(conn, 200) =~ "Log out")

    assert %{assigns: %{current_user: nil}} = UserAuth.fetch_current_user(conn, %{})

    conn =
      conn
      |> recycle()
      |> post(~p"/ui/session/log_in", %{
        "user" => %{"name" => @user_name, "password" => @user_password}
      })

    assert "/" = redir_path = redirected_to(conn, 302)

    assert %{assigns: %{current_user: @user_name}} = UserAuth.fetch_current_user(conn, %{})

    conn =
      conn
      |> recycle()
      |> get(redir_path)

    assert not (html_response(conn, 200) =~ "Log in")
    assert html_response(conn, 200) =~ "Log out"
  end

  test "login with unknown user is rejected", %{conn: conn} do
    conn = get(conn, ~p"/ui/session/log_in")

    assert html_response(conn, 200) =~ "Log in"
    assert not (html_response(conn, 200) =~ "Log out")

    conn =
      conn
      |> recycle()
      |> post(~p"/ui/session/log_in", %{
        "user" => %{"name" => "unknown", "password" => @user_password}
      })

    assert %{assigns: %{current_user: nil}} = UserAuth.fetch_current_user(conn, %{})

    assert redirected_to(conn, 302) =~ ~p"/ui/session/log_in"

    conn =
      conn
      |> recycle()
      |> get(~p"/ui/session/log_in")

    html = html_response(conn, 200)

    assert html =~ "Invalid name or password"
    assert html =~ "Log in"
    assert not (html =~ "Log out")
  end

  test "login with invalid password is rejected", %{conn: conn} do
    conn = get(conn, ~p"/ui/session/log_in")

    assert html_response(conn, 200) =~ "Log in"
    assert not (html_response(conn, 200) =~ "Log out")

    conn =
      conn
      |> recycle()
      |> post(~p"/ui/session/log_in", %{
        "user" => %{"name" => @user_name, "password" => "invalid"}
      })

    assert %{assigns: %{current_user: nil}} = UserAuth.fetch_current_user(conn, %{})

    assert redirected_to(conn, 302) =~ ~p"/ui/session/log_in"

    conn =
      conn
      |> recycle()
      |> get(~p"/ui/session/log_in")

    html = html_response(conn, 200)

    assert html =~ "Invalid name or password"
    assert html =~ "Log in"
    assert not (html =~ "Log out")
  end

  test "logout with valid credentials", %{conn: conn} do
    token = UserAuth.generate_user_session_token(@user_name)

    conn =
      conn
      |> Map.replace!(:secret_key_base, FieldHubWeb.Endpoint.config(:secret_key_base))
      |> init_test_session(%{})
      |> put_session(:user_token, token)
      |> get(~p"/")

    assert %{assigns: %{current_user: @user_name}} = UserAuth.fetch_current_user(conn, %{})

    assert not (html_response(conn, 200) =~ "Log in")
    assert html_response(conn, 200) =~ "Log out"

    conn =
      conn
      |> recycle()
      |> get(~p"/ui/session/log_out")

    assert redir_path = "/" = redirected_to(conn, 302)

    assert %{assigns: %{current_user: nil}} = UserAuth.fetch_current_user(conn, %{})

    conn =
      conn
      |> recycle()
      |> get(redir_path)

    assert html_response(conn, 200) =~ "Log in"
    assert not (html_response(conn, 200) =~ "Log out")
  end
end
