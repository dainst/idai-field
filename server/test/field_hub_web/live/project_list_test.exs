defmodule FieldHubWeb.ProjectListTest do
  use FieldHubWeb.ConnCase

  import Phoenix.ConnTest
  import Phoenix.LiveViewTest

  alias FieldHub.TestHelper
  alias FieldHubWeb.UserAuth

  @admin_user Application.compile_env(:field_hub, :couchdb_admin_name)
  @project_key "test_project"
  @project_password "test_password"

  @empty_project_key "empty_project"
  @empty_project_password "test_password"

  @admin_user Application.compile_env(:field_hub, :couchdb_admin_name)

  @project_create_button_label "Create a new project"
  @project_list_heading "Projects"

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

  test "GET /", %{conn: conn} do
    conn = get(conn, "/")
    assert html_response(conn, 200) =~ "Field Hub"
    refute html_response(conn, 200) =~ @project_create_button_label
    refute html_response(conn, 200) =~ @project_list_heading
  end

  describe "admin users" do
    test "see the project list and new project button", %{conn: conn} do
      assert {:ok, view, html} = live(conn, "/")

      assert html =~ @project_create_button_label
      assert html =~ @project_list_heading
      assert html =~ @project_key

      # Table headings (images are 0, while the images are evaluated asynchronously.)
      assert html =~ "21 Documents (48.39 KB)"
      assert html =~ "0 Thumbnails (0 B)"
      assert html =~ "0 Images (0 B)"
      assert html =~ "Last changes"

      # Database size is 32.3 KB when empty.
      assert html =~ "<td>21 (48.39 KB)</td>"

      html = render_async(view)

      # Evaluation finished, check updated table headings.
      assert html =~ "2 Thumbnails (18.84 KB"
      assert html =~ "2 Images (697.78 KB)"

      # Also check row values.
      assert html =~ "2 (697.78 KB)"
      assert html =~ "2 (18.84 KB)"
    end

    test "can sort by project key", %{conn: conn} do
      TestHelper.create_test_db_and_user(
        @empty_project_key,
        @empty_project_key,
        @empty_project_password
      )

      assert {:ok, view, html} = live(conn, "/")

      assert html =~ @empty_project_key

      render_async(view)

      assert has_element?(
               view,
               "tbody > tr:nth-child(1) > td:nth-child(1) > a",
               @empty_project_key
             )

      assert has_element?(
               view,
               "tbody > tr:nth-child(1) > td:nth-child(2)",
               "0 (32.3 KB)"
             )

      assert has_element?(
               view,
               "tbody > tr:nth-child(2) > td:nth-child(1) > a",
               @project_key
             )

      assert has_element?(
               view,
               "tbody > tr:nth-child(2) > td:nth-child(2)",
               "21 (48.39 KB)"
             )

      view
      |> element("th.sortable-list-heading:nth-child(1)")
      |> render_click()

      assert has_element?(
               view,
               "tbody > tr:nth-child(2) > td:nth-child(1) > a",
               @empty_project_key
             )

      assert has_element?(
               view,
               "tbody > tr:nth-child(2) > td:nth-child(2)",
               "0 (32.3 KB)"
             )

      assert has_element?(
               view,
               "tbody > tr:nth-child(1) > td:nth-child(1) > a",
               @project_key
             )

      assert has_element?(
               view,
               "tbody > tr:nth-child(1) > td:nth-child(2)",
               "21 (48.39 KB)"
             )

      view
      |> element("th.sortable-list-heading:nth-child(1)")
      |> render_click()

      assert has_element?(
               view,
               "tbody > tr:nth-child(1) > td:nth-child(1) > a",
               @empty_project_key
             )

      assert has_element?(
               view,
               "tbody > tr:nth-child(1) > td:nth-child(2)",
               "0 (32.3 KB)"
             )

      assert has_element?(
               view,
               "tbody > tr:nth-child(2) > td:nth-child(1) > a",
               @project_key
             )

      assert has_element?(
               view,
               "tbody > tr:nth-child(2) > td:nth-child(2)",
               "21 (48.39 KB)"
             )
    end

    setup %{conn: conn} do
      TestHelper.create_complete_example_project(@project_key, @project_key, @project_password)

      on_exit(fn ->
        TestHelper.remove_complete_example_project(@project_key, @project_key)
        TestHelper.remove_test_db_and_user(@empty_project_key, @empty_project_key)
      end)

      conn = log_in_user(conn, @admin_user)
      {:ok, %{conn: conn}}
    end
  end
end
