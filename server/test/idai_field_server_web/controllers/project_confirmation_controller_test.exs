defmodule IdaiFieldServerWeb.ProjectConfirmationControllerTest do
  use IdaiFieldServerWeb.ConnCase, async: true

  alias IdaiFieldServer.Accounts
  alias IdaiFieldServer.Repo
  import IdaiFieldServer.AccountsFixtures

  setup do
    %{project: project_fixture()}
  end

  describe "GET /projects/confirm" do
    test "renders the confirmation page", %{conn: conn} do
      conn = get(conn, Routes.project_confirmation_path(conn, :new))
      response = html_response(conn, 200)
      assert response =~ "<h1>Resend confirmation instructions</h1>"
    end
  end

  describe "POST /projects/confirm" do
    @tag :capture_log
    test "sends a new confirmation token", %{conn: conn, project: project} do
      conn =
        post(conn, Routes.project_confirmation_path(conn, :create), %{
          "project" => %{"email" => project.email}
        })

      assert redirected_to(conn) == "/"
      assert get_flash(conn, :info) =~ "If your e-mail is in our system"
      assert Repo.get_by!(Accounts.ProjectToken, project_id: project.id).context == "confirm"
    end

    test "does not send confirmation token if account is confirmed", %{conn: conn, project: project} do
      Repo.update!(Accounts.Project.confirm_changeset(project))

      conn =
        post(conn, Routes.project_confirmation_path(conn, :create), %{
          "project" => %{"email" => project.email}
        })

      assert redirected_to(conn) == "/"
      assert get_flash(conn, :info) =~ "If your e-mail is in our system"
      refute Repo.get_by(Accounts.ProjectToken, project_id: project.id)
    end

    test "does not send confirmation token if email is invalid", %{conn: conn} do
      conn =
        post(conn, Routes.project_confirmation_path(conn, :create), %{
          "project" => %{"email" => "unknown@example.com"}
        })

      assert redirected_to(conn) == "/"
      assert get_flash(conn, :info) =~ "If your e-mail is in our system"
      assert Repo.all(Accounts.ProjectToken) == []
    end
  end

  describe "GET /projects/confirm/:token" do
    test "confirms the given token once", %{conn: conn, project: project} do
      token =
        extract_project_token(fn url ->
          Accounts.deliver_project_confirmation_instructions(project, url)
        end)

      conn = get(conn, Routes.project_confirmation_path(conn, :confirm, token))
      assert redirected_to(conn) == "/"
      assert get_flash(conn, :info) =~ "Account confirmed successfully"
      assert Accounts.get_project!(project.id).confirmed_at
      refute get_session(conn, :project_token)
      assert Repo.all(Accounts.ProjectToken) == []

      conn = get(conn, Routes.project_confirmation_path(conn, :confirm, token))
      assert redirected_to(conn) == "/"
      assert get_flash(conn, :error) =~ "Confirmation link is invalid or it has expired"
    end

    test "does not confirm email with invalid token", %{conn: conn, project: project} do
      conn = get(conn, Routes.project_confirmation_path(conn, :confirm, "oops"))
      assert redirected_to(conn) == "/"
      assert get_flash(conn, :error) =~ "Confirmation link is invalid or it has expired"
      refute Accounts.get_project!(project.id).confirmed_at
    end
  end
end
