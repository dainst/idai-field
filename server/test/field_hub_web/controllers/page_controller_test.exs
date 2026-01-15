defmodule FieldHubWeb.PageControllerTest do
  use FieldHubWeb.ConnCase

  import Phoenix.ConnTest
  import Phoenix.LiveViewTest
  import ExUnit.CaptureLog

  alias FieldHub.TestHelper
  alias FieldHubWeb.UserAuth

  @project_key "test_project"
  @project_password "test_password"

  @admin_user Application.compile_env(:field_hub, :couchdb_admin_name)

  test "GET /", %{conn: conn} do
    conn = get(conn, "/")
    assert html_response(conn, 200) =~ "Field Hub"
  end

  test "project users get redirected to their project immediately", %{conn: conn} do
    TestHelper.create_test_db_and_user(@project_key, @project_key, @project_password)

    on_exit(fn ->
      TestHelper.remove_test_db_and_user(@project_key, @project_key)
    end)

    token = UserAuth.generate_user_session_token(@project_key)

    conn =
      conn
      |> Map.replace!(:secret_key_base, FieldHubWeb.Endpoint.config(:secret_key_base))
      |> init_test_session(%{})
      |> put_session(:user_token, token)

    expected_redirect = "/ui/projects/show/#{@project_key}"

    assert {
             :error,
             {
               :live_redirect,
               %{to: ^expected_redirect}
             }
           } = live(conn, "/")
  end

  test "admin users see the project list and create new project button", %{conn: conn} do
    TestHelper.create_test_db_and_user(@project_key, @project_key, @project_password)

    on_exit(fn ->
      TestHelper.remove_test_db_and_user(@project_key, @project_key)
    end)

    token = UserAuth.generate_user_session_token(@admin_user)

    conn =
      conn
      |> Map.replace!(:secret_key_base, FieldHubWeb.Endpoint.config(:secret_key_base))
      |> init_test_session(%{})
      |> put_session(:user_token, token)

    assert {:ok, view, html} = live(conn, "/")

    assert html =~ "Loading projects list..."

    capture_log(fn ->
      # Capture error logs produced by development projects that miss their
      # image directory (because the test image directory is a different one).
      # TODO: Make this not hacky, see https://github.com/dainst/idai-field/issues/377.
      html = render_async(view)

      assert html =~ "Number of projects"
      assert html =~ "Documents"
      assert html =~ "Images"
      assert html =~ "<div class=\"dashboard-card-main-number\">\n      1\n    </div>"
      assert html =~ "<div class=\"dashboard-card-main-number\">32.3 KB</div>"
      assert html =~ "<div class=\"dashboard-card-main-number\">0 B</div>"

      assert html =~ "<td class=\"cursor-pointer\">#{@project_key}</td>"
    end)
  end

  # describe "admin users" do
  #   setup %{conn: conn} do
  #     # Run before each test
  #     TestHelper.create_test_db_and_user(@project, @user_name, @user_password)

  #     on_exit(fn ->
  #       # Run after each test
  #       TestHelper.remove_test_db_and_user(@project, @user_name)
  #     end)

  #     token = UserAuth.generate_user_session_token(@admin_user)

  #     conn =
  #       conn
  #       |> Map.replace!(:secret_key_base, FieldHubWeb.Endpoint.config(:secret_key_base))
  #       |> init_test_session(%{})
  #       |> put_session(:user_token, token)

  #     %{conn: conn}
  #   end

  #   test "see the dashboard when only one project is in the system", %{conn: conn} do
  #     {
  #       :ok,
  #       view,
  #       html
  #     } = live(conn, "/")

  #     assert html =~ "Loading projects list..."

  #     html = render_async(view)

  #     refute html =~ "Loading projects list..."
  #     # assert html =~ @user_name
  #     assert html =~ "Project <b>#{@project}</b> page"
  #   end

  #   test "GET / without valid session token does not display projects", %{conn: conn} do
  #     conn =
  #       conn
  #       |> get("/")

  #     refute html_response(conn, 200) =~
  #              "phx-click=\"go_to_project\" phx-value-id=\"test_project\""
  #   end
  # end
end
