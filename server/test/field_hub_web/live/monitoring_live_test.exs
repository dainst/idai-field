defmodule FieldHubWeb.MonitoringLiveTest do
  import Phoenix.ConnTest
  import Phoenix.LiveViewTest

  use FieldHubWeb.ConnCase

  alias FieldHub.Issues
  alias FieldHubWeb.MonitoringLive

  alias FieldHub.{
    TestHelper
  }

  @endpoint FieldHubWeb.Endpoint

  @project "test_project"
  @user_name "test_user"
  @user_password "test_password"

  setup_all %{} do
    TestHelper.clear_authentication_token_cache()

    # Run before each tests
    TestHelper.create_complete_example_project(@project, @user_name, @user_password)

    on_exit(fn ->
      # Run after each tests
      TestHelper.remove_complete_example_project(
        @project,
        @user_name
      )
    end)
  end

  test "redirect to login if not authenticated", %{conn: conn} do
    assert {:error, {:redirect, %{flash: _, to: "/ui/session/new"}}} =
             conn
             |> live("/ui/monitoring/#{@project}")
  end

  test "redirect to landing page if not authorized for project", %{conn: conn} do
    assert {:error, {:redirect, %{flash: _, to: "/"}}} =
             conn
             |> log_in_user("nope")
             |> live("/ui/monitoring/#{@project}")
  end

  describe "with logged in user" do
    setup %{conn: conn} do
      conn = log_in_user(conn, @user_name)

      {:ok, %{conn: conn}}
    end

    test "authorized user loads monitoring page", %{conn: conn} do
      {:ok, view, html_on_mount} = live(conn, "/ui/monitoring/#{@project}")

      assert html_on_mount =~ "<h1>Project <i>#{@project}</i></h1>"
      # statistics
      assert html_on_mount =~ "<h2>Statistics</h2>\n\nLoading..."
      # issues
      assert html_on_mount =~ "<h2>Issues</h2>\n\n🔍 Evaluating..."

      html = render(view)

      assert html =~ "<h1>Project <i>#{@project}</i></h1>"

      assert html =~
               "<h2>Statistics</h2><section>Database documents: 21</section><section>Database size: 48.39 KB (49548 bytes)</section><section>Original images: 2, size: 697.78 KB (714528 bytes)</section><section>Thumbnail images: 2, size: 18.84 KB (19295 bytes)</section>"

      assert html =~ "<h2>Issues</h2>\n\nNone."
    end

    test "issues are displayed, even if no custom label or description defined" do
      issues =
        TestHelper.get_example_issues() ++
          [
            %Issues.Issue{
              type: :unknown,
              severity: :error,
              data: %{
                some: ["1", "2", "3"],
                unknown: :unknown,
                data: %{is: :still, ok: "!"}
              }
            },
            %Issues.Issue{
              type: :unknown_without_data,
              severity: :error,
              data: %{}
            }
          ]

      count = Enum.count(issues)
      groups = Enum.group_by(issues, fn %{type: type} -> type end)

      html =
        render_component(MonitoringLive, %{
          current_user: "test_user",
          flash: %{},
          issue_count: count,
          issues: groups,
          live_action: nil,
          project: "test_project",
          stats: :loading
        })

      assert html =~ "Project file directory not found (1)"
      assert html =~ "Missing original images (1)"
      assert html =~ "Image variants file size (1)"
      assert html =~ "No default map layer (1)"
      assert html =~ "No project document (1)"
      assert html =~ "unknown (1)"
      assert html =~ "unknown_without_data (1)"
    end
  end
end
