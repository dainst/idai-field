defmodule IdaiFieldServerWeb.ProjectSessionControllerTest do
  use IdaiFieldServerWeb.ConnCase, async: true

  import IdaiFieldServer.AccountsFixtures

  setup do
    %{project: project_fixture()}
  end

  describe "GET /projects/log_in" do
    test "renders log in page", %{conn: conn} do
      conn = get(conn, Routes.project_session_path(conn, :new))
      response = html_response(conn, 200)
      assert response =~ "<h1>Log in</h1>"
      assert response =~ "Log in</a>"
      assert response =~ "Register</a>"
    end

    test "redirects if already logged in", %{conn: conn, project: project} do
      conn = conn |> log_in_project(project) |> get(Routes.project_session_path(conn, :new))
      assert redirected_to(conn) == "/"
    end
  end

  describe "POST /projects/log_in" do
    test "logs the project in", %{conn: conn, project: project} do
      conn =
        post(conn, Routes.project_session_path(conn, :create), %{
          "project" => %{"email" => project.email, "password" => valid_project_password()}
        })

      assert get_session(conn, :project_token)
      assert redirected_to(conn) =~ "/"

      # Now do a logged in request and assert on the menu
      conn = get(conn, "/")
      response = html_response(conn, 200)
      assert response =~ project.email
      assert response =~ "Settings</a>"
      assert response =~ "Log out</a>"
    end

    test "logs the project in with remember me", %{conn: conn, project: project} do
      conn =
        post(conn, Routes.project_session_path(conn, :create), %{
          "project" => %{
            "email" => project.email,
            "password" => valid_project_password(),
            "remember_me" => "true"
          }
        })

      assert conn.resp_cookies["project_remember_me"]
      assert redirected_to(conn) =~ "/"
    end

    test "emits error message with invalid credentials", %{conn: conn, project: project} do
      conn =
        post(conn, Routes.project_session_path(conn, :create), %{
          "project" => %{"email" => project.email, "password" => "invalid_password"}
        })

      response = html_response(conn, 200)
      assert response =~ "<h1>Log in</h1>"
      assert response =~ "Invalid e-mail or password"
    end
  end

  describe "DELETE /projects/log_out" do
    test "logs the project out", %{conn: conn, project: project} do
      conn = conn |> log_in_project(project) |> delete(Routes.project_session_path(conn, :delete))
      assert redirected_to(conn) == "/"
      refute get_session(conn, :project_token)
      assert get_flash(conn, :info) =~ "Logged out successfully"
    end

    test "succeeds even if the project is not logged in", %{conn: conn} do
      conn = delete(conn, Routes.project_session_path(conn, :delete))
      assert redirected_to(conn) == "/"
      refute get_session(conn, :project_token)
      assert get_flash(conn, :info) =~ "Logged out successfully"
    end
  end
end
