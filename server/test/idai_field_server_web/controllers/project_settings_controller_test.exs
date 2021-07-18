defmodule IdaiFieldServerWeb.ProjectSettingsControllerTest do
  use IdaiFieldServerWeb.ConnCase, async: true

  alias IdaiFieldServer.Accounts
  import IdaiFieldServer.AccountsFixtures

  setup :register_and_log_in_project

  describe "GET /projects/settings" do
    test "renders settings page", %{conn: conn} do
      conn = get(conn, Routes.project_settings_path(conn, :edit))
      response = html_response(conn, 200)
      assert response =~ "<h1>Settings</h1>"
    end

    test "redirects if project is not logged in" do
      conn = build_conn()
      conn = get(conn, Routes.project_settings_path(conn, :edit))
      assert redirected_to(conn) == Routes.project_session_path(conn, :new)
    end
  end

  describe "PUT /projects/settings/update_password" do
    test "updates the project password and resets tokens", %{conn: conn, project: project} do
      new_password_conn =
        put(conn, Routes.project_settings_path(conn, :update_password), %{
          "current_password" => valid_project_password(),
          "project" => %{
            "password" => "new valid password",
            "password_confirmation" => "new valid password"
          }
        })

      assert redirected_to(new_password_conn) == Routes.project_settings_path(conn, :edit)
      assert get_session(new_password_conn, :project_token) != get_session(conn, :project_token)
      assert get_flash(new_password_conn, :info) =~ "Password updated successfully"
      assert Accounts.get_project_by_email_and_password(project.email, "new valid password")
    end

    test "does not update password on invalid data", %{conn: conn} do
      old_password_conn =
        put(conn, Routes.project_settings_path(conn, :update_password), %{
          "current_password" => "invalid",
          "project" => %{
            "password" => "too short",
            "password_confirmation" => "does not match"
          }
        })

      response = html_response(old_password_conn, 200)
      assert response =~ "<h1>Settings</h1>"
      assert response =~ "should be at least 12 character(s)"
      assert response =~ "does not match password"
      assert response =~ "is not valid"

      assert get_session(old_password_conn, :project_token) == get_session(conn, :project_token)
    end
  end

  describe "PUT /projects/settings/update_email" do
    @tag :capture_log
    test "updates the project email", %{conn: conn, project: project} do
      conn =
        put(conn, Routes.project_settings_path(conn, :update_email), %{
          "current_password" => valid_project_password(),
          "project" => %{"email" => unique_project_email()}
        })

      assert redirected_to(conn) == Routes.project_settings_path(conn, :edit)
      assert get_flash(conn, :info) =~ "A link to confirm your e-mail"
      assert Accounts.get_project_by_email(project.email)
    end

    test "does not update email on invalid data", %{conn: conn} do
      conn =
        put(conn, Routes.project_settings_path(conn, :update_email), %{
          "current_password" => "invalid",
          "project" => %{"email" => "with spaces"}
        })

      response = html_response(conn, 200)
      assert response =~ "<h1>Settings</h1>"
      assert response =~ "must have the @ sign and no spaces"
      assert response =~ "is not valid"
    end
  end

  describe "GET /projects/settings/confirm_email/:token" do
    setup %{project: project} do
      email = unique_project_email()

      token =
        extract_project_token(fn url ->
          Accounts.deliver_update_email_instructions(%{project | email: email}, project.email, url)
        end)

      %{token: token, email: email}
    end

    test "updates the project email once", %{conn: conn, project: project, token: token, email: email} do
      conn = get(conn, Routes.project_settings_path(conn, :confirm_email, token))
      assert redirected_to(conn) == Routes.project_settings_path(conn, :edit)
      assert get_flash(conn, :info) =~ "E-mail changed successfully"
      refute Accounts.get_project_by_email(project.email)
      assert Accounts.get_project_by_email(email)

      conn = get(conn, Routes.project_settings_path(conn, :confirm_email, token))
      assert redirected_to(conn) == Routes.project_settings_path(conn, :edit)
      assert get_flash(conn, :error) =~ "Email change link is invalid or it has expired"
    end

    test "does not update email with invalid token", %{conn: conn, project: project} do
      conn = get(conn, Routes.project_settings_path(conn, :confirm_email, "oops"))
      assert redirected_to(conn) == Routes.project_settings_path(conn, :edit)
      assert get_flash(conn, :error) =~ "Email change link is invalid or it has expired"
      assert Accounts.get_project_by_email(project.email)
    end

    test "redirects if project is not logged in", %{token: token} do
      conn = build_conn()
      conn = get(conn, Routes.project_settings_path(conn, :confirm_email, token))
      assert redirected_to(conn) == Routes.project_session_path(conn, :new)
    end
  end
end
