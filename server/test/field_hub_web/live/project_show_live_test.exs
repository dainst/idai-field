defmodule FieldHubWeb.ProjectShowLiveTest do
  import Phoenix.ConnTest
  import Phoenix.LiveViewTest

  use FieldHubWeb.ConnCase

  alias FieldHub.Issues
  alias FieldHubWeb.ProjectShowLive

  alias FieldHub.{
    TestHelper
  }

  @endpoint FieldHubWeb.Endpoint

  @project "test_project"
  @user_name "test_user"
  @user_password "test_password"

  test "redirect to login if not authenticated", %{conn: conn} do
    assert {:error, {:redirect, %{flash: _, to: "/ui/session/new"}}} =
             conn
             |> live("/ui/projects/show/#{@project}")
  end

  test "redirect to landing page if not authorized for project", %{conn: conn} do
    assert {:error, {:redirect, %{flash: _, to: "/"}}} =
             conn
             |> log_in_user("nope")
             |> live("/ui/projects/show/#{@project}")
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

    groups =
      issues
      |> Enum.group_by(fn %{type: type, severity: severity} -> {type, severity} end)

    html =
      render_component(ProjectShowLive, %{
        current_user: "test_user",
        flash: %{},
        issue_count: count,
        issue_status: :idle,
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
    assert html =~ "Unexpected issue (1)"
    assert html =~ "Unresolved relation (1)"
    assert html =~ "unknown (1)"
    assert html =~ "unknown_without_data (1)"
  end

  describe "with logged in user" do
    setup %{conn: conn} do
      # Run before each tests
      TestHelper.create_complete_example_project(@project, @user_name, @user_password)

      on_exit(fn ->
        # Run after each tests
        TestHelper.remove_complete_example_project(
          @project,
          @user_name
        )
      end)

      conn = log_in_user(conn, @user_name)
      {:ok, %{conn: conn}}
    end

    test "authorized user can see monitoring page", %{conn: conn} do
      {:ok, view, html_on_mount} = live(conn, "/ui/projects/show/#{@project}")

      assert html_on_mount =~ "<h1>Project <i>#{@project}</i></h1>"
      assert html_on_mount =~ "<h2>Statistics</h2>\n\nLoading..."
      assert html_on_mount =~ "<h2><div class=\"row\"><div class=\"column\">Issues</div>"

      html = render(view)

      assert html =~ "<h1>Project <i>#{@project}</i></h1>"

      assert html =~
               "<h2>Statistics</h2><section>Database documents: 21</section><section>Database size: 48.39 KB (49548 bytes)</section><section>Original images: 2, size: 697.78 KB (714528 bytes)</section><section>Thumbnail images: 2, size: 18.84 KB (19295 bytes)</section>"
    end

    test "user can trigger issue evaluation", %{conn: conn} do
      {:ok, view, _html_on_mount} = live(conn, "/ui/projects/show/#{@project}")

      TestHelper.delete_document(@project, "project")

      html =
        view
        |> element("button")
        |> render_click()

      assert html =~ "🔍 Evaluating..."

      # Elixir/Erlang kinda deep dive:
      #
      # In general, the ProjectShowLive's `handle_info/3` and `handle_event/3` communicate via events/messages
      # that they send to the view process.
      #
      # The `render_click/1` above sends a event "evaluate_issues" to the view process.
      # The handle_event function itself then sends another message (:update_issues) and updates the
      # socket's :issue_status to :evaluating. It then returns the socket.
      #
      # The views state at this point in the test: :issue_status is :evaluating (and HTML reflects that),
      # but there are no issues evaluated yet, because the :update_issues message has not been handled by
      # the view yet.
      #
      # In order to wait for the evaluation result, we call the following function:
      _ = :sys.get_state(view.pid)
      # Because all messages are handled sequentially by the process, we 'wait' for all
      # previous messages to be completed by sending one of our own (`get_state/1`). As soon as we get
      # a result for `get_state/1` we know that all other messages in the queue have been processed
      # (including :update_issues) and we should have our issues visible in the HTML.
      html =
        view
        |> render()

      assert html =~ "Issues (3)"
    end
  end
end
