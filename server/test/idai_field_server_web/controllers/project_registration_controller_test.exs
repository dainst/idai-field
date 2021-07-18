defmodule IdaiFieldServerWeb.ProjectRegistrationControllerTest do
  use IdaiFieldServerWeb.ConnCase, async: true

  import IdaiFieldServer.AccountsFixtures

  describe "GET /projects/register" do
    test "renders registration page", %{conn: conn} do
      conn = get(conn, Routes.project_registration_path(conn, :new))
      response = html_response(conn, 200)
      assert response =~ "<h1>Register</h1>"
      assert response =~ "Log in</a>"
      assert response =~ "Register</a>"
    end

    test "redirects if already logged in", %{conn: conn} do
      conn = conn |> log_in_project(project_fixture()) |> get(Routes.project_registration_path(conn, :new))
      assert redirected_to(conn) == "/"
    end
  end

  describe "POST /projects/register" do
    @tag :capture_log
    test "creates account and logs the project in", %{conn: conn} do
      email = unique_project_email()

      conn =
        post(conn, Routes.project_registration_path(conn, :create), %{
          "project" => %{"email" => email, "password" => valid_project_password()}
        })

      assert get_session(conn, :project_token)
      assert redirected_to(conn) =~ "/"

      # Now do a logged in request and assert on the menu
      conn = get(conn, "/")
      response = html_response(conn, 200)
      assert response =~ email
      assert response =~ "Settings</a>"
      assert response =~ "Log out</a>"
    end

    test "render errors for invalid data", %{conn: conn} do
      conn =
        post(conn, Routes.project_registration_path(conn, :create), %{
          "project" => %{"email" => "with spaces", "password" => "too short"}
        })

      response = html_response(conn, 200)
      assert response =~ "<h1>Register</h1>"
      assert response =~ "must have the @ sign and no spaces"
      assert response =~ "should be at least 12 character"
    end
  end
end
