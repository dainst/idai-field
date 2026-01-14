defmodule FieldHubWeb.PageControllerTest do
  use FieldHubWeb.ConnCase

  import Phoenix.ConnTest
  import Phoenix.LiveViewTest

  alias FieldHub.TestHelper
  alias FieldHubWeb.UserAuth

  @project "test_project"
  @user_name "test_user"
  @user_password "test_password"

  @admin_user Application.compile_env(:field_hub, :couchdb_admin_name)

  test "GET /", %{conn: conn} do
    conn = get(conn, "/")
    assert html_response(conn, 200) =~ "Field Hub"
  end

  test "project users get redirected to their project immediately", %{conn: conn} do
    TestHelper.create_test_db_and_user(@project, @user_name, @user_password)

    on_exit(fn ->
      TestHelper.remove_test_db_and_user(@project, @user_name)
    end)

    token = UserAuth.generate_user_session_token(@user_name)

    conn =
      conn
      |> Map.replace!(:secret_key_base, FieldHubWeb.Endpoint.config(:secret_key_base))
      |> init_test_session(%{})
      |> put_session(:user_token, token)

    expected_redirect = "/ui/projects/show/#{@user_name}"

    assert {
             :error,
             {
               :live_redirect,
               %{to: ^expected_redirect}
             }
           } = live(conn, "/")
  end

  describe "admin users" do
    setup %{conn: conn} do
      # Run before each test
      TestHelper.create_test_db_and_user(@project, @user_name, @user_password)

      on_exit(fn ->
        # Run after each test
        TestHelper.remove_test_db_and_user(@project, @user_name)
      end)

      token = UserAuth.generate_user_session_token(@admin_user)

      conn =
        conn
        |> Map.replace!(:secret_key_base, FieldHubWeb.Endpoint.config(:secret_key_base))
        |> init_test_session(%{})
        |> put_session(:user_token, token)

      %{conn: conn}
    end

    test "see the dashboard when only one project is in the system", %{conn: conn} do
      {
        :ok,
        view,
        html
      } = live(conn, "/")

      assert html =~ "Loading projects list..."

      html = render_async(view)

      refute html =~ "Loading projects list..."
      # assert html =~ @user_name
      assert html =~ "phx-value-id=\"test_project\""
    end

    test "GET / without valid session token does not display projects", %{conn: conn} do
      conn =
        conn
        |> get("/")

      refute html_response(conn, 200) =~
               "phx-click=\"go_to_project\" phx-value-id=\"test_project\""
    end
  end
end
