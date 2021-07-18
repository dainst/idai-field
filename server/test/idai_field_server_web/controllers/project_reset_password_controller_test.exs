defmodule IdaiFieldServerWeb.ProjectResetPasswordControllerTest do
  use IdaiFieldServerWeb.ConnCase, async: true

  alias IdaiFieldServer.Accounts
  alias IdaiFieldServer.Repo
  import IdaiFieldServer.AccountsFixtures

  setup do
    %{project: project_fixture()}
  end

  describe "GET /projects/reset_password" do
    test "renders the reset password page", %{conn: conn} do
      conn = get(conn, Routes.project_reset_password_path(conn, :new))
      response = html_response(conn, 200)
      assert response =~ "<h1>Forgot your password?</h1>"
    end
  end

  describe "POST /projects/reset_password" do
    @tag :capture_log
    test "sends a new reset password token", %{conn: conn, project: project} do
      conn =
        post(conn, Routes.project_reset_password_path(conn, :create), %{
          "project" => %{"email" => project.email}
        })

      assert redirected_to(conn) == "/"
      assert get_flash(conn, :info) =~ "If your e-mail is in our system"
      assert Repo.get_by!(Accounts.ProjectToken, project_id: project.id).context == "reset_password"
    end

    test "does not send reset password token if email is invalid", %{conn: conn} do
      conn =
        post(conn, Routes.project_reset_password_path(conn, :create), %{
          "project" => %{"email" => "unknown@example.com"}
        })

      assert redirected_to(conn) == "/"
      assert get_flash(conn, :info) =~ "If your e-mail is in our system"
      assert Repo.all(Accounts.ProjectToken) == []
    end
  end

  describe "GET /projects/reset_password/:token" do
    setup %{project: project} do
      token =
        extract_project_token(fn url ->
          Accounts.deliver_project_reset_password_instructions(project, url)
        end)

      %{token: token}
    end

    test "renders reset password", %{conn: conn, token: token} do
      conn = get(conn, Routes.project_reset_password_path(conn, :edit, token))
      assert html_response(conn, 200) =~ "<h1>Reset password</h1>"
    end

    test "does not render reset password with invalid token", %{conn: conn} do
      conn = get(conn, Routes.project_reset_password_path(conn, :edit, "oops"))
      assert redirected_to(conn) == "/"
      assert get_flash(conn, :error) =~ "Reset password link is invalid or it has expired"
    end
  end

  describe "PUT /projects/reset_password/:token" do
    setup %{project: project} do
      token =
        extract_project_token(fn url ->
          Accounts.deliver_project_reset_password_instructions(project, url)
        end)

      %{token: token}
    end

    test "resets password once", %{conn: conn, project: project, token: token} do
      conn =
        put(conn, Routes.project_reset_password_path(conn, :update, token), %{
          "project" => %{
            "password" => "new valid password",
            "password_confirmation" => "new valid password"
          }
        })

      assert redirected_to(conn) == Routes.project_session_path(conn, :new)
      refute get_session(conn, :project_token)
      assert get_flash(conn, :info) =~ "Password reset successfully"
      assert Accounts.get_project_by_email_and_password(project.email, "new valid password")
    end

    test "does not reset password on invalid data", %{conn: conn, token: token} do
      conn =
        put(conn, Routes.project_reset_password_path(conn, :update, token), %{
          "project" => %{
            "password" => "too short",
            "password_confirmation" => "does not match"
          }
        })

      response = html_response(conn, 200)
      assert response =~ "<h1>Reset password</h1>"
      assert response =~ "should be at least 12 character(s)"
      assert response =~ "does not match password"
    end

    test "does not reset password with invalid token", %{conn: conn} do
      conn = put(conn, Routes.project_reset_password_path(conn, :update, "oops"))
      assert redirected_to(conn) == "/"
      assert get_flash(conn, :error) =~ "Reset password link is invalid or it has expired"
    end
  end
end
