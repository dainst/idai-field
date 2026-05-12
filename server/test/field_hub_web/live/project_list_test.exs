defmodule FieldHubWeb.ProjectListTest do
  use FieldHubWeb.ConnCase

  import Phoenix.ConnTest
  import Phoenix.LiveViewTest
  import ExUnit.CaptureLog

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

  @project_heading "th.sortable-list-heading:nth-child(1)"
  @document_count_heading "th.sortable-list-heading:nth-child(2)"
  @thumbnail_count_heading "th.sortable-list-heading:nth-child(3)"
  @image_count_heading "th.sortable-list-heading:nth-child(4)"
  @changes_heading "th.sortable-list-heading:nth-child(5)"

  @first_entry_project_column "tbody > tr:nth-child(1) > td:nth-child(1) > a"
  @second_entry_project_column "tbody > tr:nth-child(2) > td:nth-child(1) > a"

  @first_entry_documents_column "tbody > tr:nth-child(1) > td:nth-child(2)"
  @second_entry_documents_column "tbody > tr:nth-child(2) > td:nth-child(2)"

  @first_entry_thumbnail_column "tbody > tr:nth-child(1) > td:nth-child(3)"
  @first_entry_image_column "tbody > tr:nth-child(1) > td:nth-child(4)"

  describe "admin users" do
    test "see the project list and new project button", %{conn: conn} do
      assert {:ok, view, html} = live(conn, "/")

      assert html =~ @project_create_button_label
      assert html =~ @project_list_heading
      assert html =~ @project_key

      # Table headings (images are 0, while the images are evaluated asynchronously.)
      assert html =~ "21 Documents (80.69 KB)"
      assert html =~ "0 Thumbnails (0 B)"
      assert html =~ "0 Images (0 B)"
      assert html =~ "Last changes"

      # Database size for @project_key.
      assert html =~ "21 (48.39 KB)"

      html = render_async(view)

      # Evaluation finished, check updated table headings.
      assert html =~ "2 Thumbnails (18.84 KB"
      assert html =~ "2 Images (697.78 KB)"

      # Also check row values.
      assert html =~ "2 (697.78 KB)"
      assert html =~ "2 (18.84 KB)"
    end

    test "can sort by project key", %{conn: conn} do
      assert {:ok, view, html} = live(conn, "/")

      assert html =~ @empty_project_key

      render_async(view)

      assert has_element?(view, @first_entry_project_column, @empty_project_key)
      assert has_element?(view, @first_entry_documents_column, "0 (32.3 KB)")
      assert has_element?(view, @second_entry_project_column, @project_key)
      assert has_element?(view, @second_entry_documents_column, "21 (48.39 KB)")

      view
      |> element(@project_heading)
      |> render_click()

      assert has_element?(view, @first_entry_project_column, @project_key)
      assert has_element?(view, @first_entry_documents_column, "21 (48.39 KB)")
      assert has_element?(view, @second_entry_project_column, @empty_project_key)
      assert has_element?(view, @second_entry_documents_column, "0 (32.3 KB)")

      view
      |> element(@project_heading)
      |> render_click()

      assert has_element?(view, @first_entry_project_column, @empty_project_key)
      assert has_element?(view, @first_entry_documents_column, "0 (32.3 KB)")
      assert has_element?(view, @second_entry_project_column, @project_key)
      assert has_element?(view, @second_entry_documents_column, "21 (48.39 KB)")
    end

    test "can sort by document count key", %{conn: conn} do
      assert {:ok, view, html} = live(conn, "/")

      assert html =~ @empty_project_key

      render_async(view)

      assert has_element?(view, @first_entry_project_column, @empty_project_key)
      assert has_element?(view, @first_entry_documents_column, "0 (32.3 KB)")
      assert has_element?(view, @second_entry_project_column, @project_key)
      assert has_element?(view, @second_entry_documents_column, "21 (48.39 KB)")

      view
      |> element(@document_count_heading)
      |> render_click()

      # Should stay the same
      assert has_element?(view, @first_entry_project_column, @empty_project_key)
      assert has_element?(view, @first_entry_documents_column, "0 (32.3 KB)")
      assert has_element?(view, @second_entry_project_column, @project_key)
      assert has_element?(view, @second_entry_documents_column, "21 (48.39 KB)")

      view
      |> element(@document_count_heading)
      |> render_click()

      assert has_element?(view, @first_entry_project_column, @project_key)
      assert has_element?(view, @first_entry_documents_column, "21 (48.39 KB)")
      assert has_element?(view, @second_entry_project_column, @empty_project_key)
      assert has_element?(view, @second_entry_documents_column, "0 (32.3 KB)")
    end

    test "can sort by thumbnail count key", %{conn: conn} do
      assert {:ok, view, html} = live(conn, "/")

      assert html =~ @empty_project_key

      render_async(view)

      assert has_element?(view, @first_entry_project_column, @empty_project_key)
      assert has_element?(view, @first_entry_documents_column, "0 (32.3 KB)")
      assert has_element?(view, @second_entry_project_column, @project_key)
      assert has_element?(view, @second_entry_documents_column, "21 (48.39 KB)")

      view
      |> element(@thumbnail_count_heading)
      |> render_click()

      # Should stay the same
      assert has_element?(view, @first_entry_project_column, @empty_project_key)
      assert has_element?(view, @first_entry_documents_column, "0 (32.3 KB)")
      assert has_element?(view, @second_entry_project_column, @project_key)
      assert has_element?(view, @second_entry_documents_column, "21 (48.39 KB)")

      view
      |> element(@thumbnail_count_heading)
      |> render_click()

      assert has_element?(view, @first_entry_project_column, @project_key)
      assert has_element?(view, @first_entry_documents_column, "21 (48.39 KB)")
      assert has_element?(view, @second_entry_project_column, @empty_project_key)
      assert has_element?(view, @second_entry_documents_column, "0 (32.3 KB)")
    end

    test "can sort by image count key", %{conn: conn} do
      assert {:ok, view, html} = live(conn, "/")

      assert html =~ @empty_project_key

      render_async(view)

      assert has_element?(view, @first_entry_project_column, @empty_project_key)
      assert has_element?(view, @first_entry_documents_column, "0 (32.3 KB)")
      assert has_element?(view, @second_entry_project_column, @project_key)
      assert has_element?(view, @second_entry_documents_column, "21 (48.39 KB)")

      view
      |> element(@image_count_heading)
      |> render_click()

      # Should stay the same
      assert has_element?(view, @first_entry_project_column, @empty_project_key)
      assert has_element?(view, @first_entry_documents_column, "0 (32.3 KB)")
      assert has_element?(view, @second_entry_project_column, @project_key)
      assert has_element?(view, @second_entry_documents_column, "21 (48.39 KB)")

      view
      |> element(@image_count_heading)
      |> render_click()

      assert has_element?(view, @first_entry_project_column, @project_key)
      assert has_element?(view, @first_entry_documents_column, "21 (48.39 KB)")
      assert has_element?(view, @second_entry_project_column, @empty_project_key)
      assert has_element?(view, @second_entry_documents_column, "0 (32.3 KB)")
    end

    test "can sort by changes key", %{conn: conn} do
      assert {:ok, view, html} = live(conn, "/")

      assert html =~ @empty_project_key

      render_async(view)

      assert has_element?(view, @first_entry_project_column, @empty_project_key)
      assert has_element?(view, @first_entry_documents_column, "0 (32.3 KB)")
      assert has_element?(view, @second_entry_project_column, @project_key)
      assert has_element?(view, @second_entry_documents_column, "21 (48.39 KB)")

      view
      |> element(@changes_heading)
      |> render_click()

      # Should stay the same
      assert has_element?(view, @first_entry_project_column, @empty_project_key)
      assert has_element?(view, @first_entry_documents_column, "0 (32.3 KB)")
      assert has_element?(view, @second_entry_project_column, @project_key)
      assert has_element?(view, @second_entry_documents_column, "21 (48.39 KB)")

      view
      |> element(@changes_heading)
      |> render_click()

      assert has_element?(view, @first_entry_project_column, @project_key)
      assert has_element?(view, @first_entry_documents_column, "21 (48.39 KB)")
      assert has_element?(view, @second_entry_project_column, @empty_project_key)
      assert has_element?(view, @second_entry_documents_column, "0 (32.3 KB)")
    end

    @file_directory_root Application.compile_env(:field_hub, :file_directory_root)
    test "can see errors", %{conn: conn} do
      missing_directory = "#{@file_directory_root}/#{@empty_project_key}/thumbnail_images"

      File.rmdir(missing_directory)

      log =
        capture_log(fn ->
          assert {:ok, view, _html} = live(conn, "/")

          :erlang.trace(view.pid, true, [:receive])

          assert_receive({
            :DOWN,
            _ref,
            :process,
            _pid,
            {%File.Error{}, __stack}
          })

          html = render(view)

          assert html =~
                   "Some projects have serious data <a href=\"/#issues-section\" data-phx-link=\"patch\" data-phx-link-state=\"push\">issues</a>."

          assert view
                 |> element(@first_entry_thumbnail_column)
                 |> render() =~ "Error, see below."

          assert view
                 |> element(@first_entry_image_column)
                 |> render() =~ "Error, see below."

          assert html =~
                   "Project files inaccessible (1)"

          assert html =~
                   "System failed to read the project&#39;s file store!"
        end)

      assert log =~
               "(File.Error) could not list directory \"#{missing_directory}\": no such file or directory"
    end

    setup %{conn: conn} do
      TestHelper.create_complete_example_project(@project_key, @project_key, @project_password)

      TestHelper.create_test_db_and_user(
        @empty_project_key,
        @empty_project_key,
        @empty_project_password
      )

      on_exit(fn ->
        TestHelper.remove_complete_example_project(@project_key, @project_key)
        TestHelper.remove_test_db_and_user(@empty_project_key, @empty_project_key)
      end)

      conn = log_in_user(conn, @admin_user)
      {:ok, %{conn: conn}}
    end
  end
end
