defmodule FieldHubWeb.ProjectShowLiveTest do
  import Phoenix.ConnTest
  import Phoenix.LiveViewTest

  use FieldHubWeb.ConnCase

  alias FieldHubWeb.{
    UserAuth,
    ProjectShowLive
  }

  alias FieldHub.{
    Project,
    CouchService,
    Issues,
    User,
    TestHelper
  }

  @endpoint FieldHubWeb.Endpoint

  @project "test_project"
  @user_name "test_project"
  @user_password "test_password"

  @admin_user Application.compile_env(:field_hub, :couchdb_admin_name)

  test "redirect to login if not authenticated", %{conn: conn} do
    # Test the authentication plug (http)
    assert {:error, {:redirect, %{flash: _, to: "/ui/session/new"}}} =
             conn
             |> live("/ui/projects/show/#{@project}")

    # Test the mount function (websocket), this makes sure that users with invalidated/old user token can not
    # access the page.
    socket =
      ProjectShowLive.mount(
        %{"project" => @project},
        %{"user_token" => "invalid"},
        %Phoenix.LiveView.Socket{}
      )

    assert {:redirect, %{to: "/"}} = socket.redirected
  end

  test "redirect to landing page if not authorized for project", %{conn: conn} do
    unknown_user = "unknown"

    # Test the authorization plug (http)
    assert {:error, {:redirect, %{flash: _, to: "/"}}} =
             conn
             |> log_in_user(unknown_user)
             |> live("/ui/projects/show/#{@project}")

    # Test the mount function (websocket), this makes sure that users that navigated here from another
    # live view with an existing socket are authorized.
    socket =
      ProjectShowLive.mount(
        %{"project" => @project},
        %{"user_token" => UserAuth.generate_user_session_token(unknown_user)},
        %Phoenix.LiveView.Socket{}
      )

    assert {:redirect, %{to: "/"}} = socket.redirected
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
        supervisor: :loading,
        contact: :loading,
        staff: :loading,
        stats: :loading
      })

    assert html =~ "Project file directory not found (1)"
    assert html =~ "Missing original images (1)"
    assert html =~ "Original images file size (1)"
    assert html =~ "No default map layer (1)"
    assert html =~ "No project document (1)"
    assert html =~ "Unexpected issue (1)"
    assert html =~ "Unresolved relation (1)"
    assert html =~ "Images missing copyright information (1)"
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
      assert html_on_mount =~ "<tr><td>Supervisor</td><td>\nLoading...\n</td></tr>"
      assert html_on_mount =~ "<tr><td>Contact</td><td>\nLoading...\n</td></tr>"
      assert html_on_mount =~ "<tr><td>Staff</td><td>\nLoading...\n</td></tr>"
      assert html_on_mount =~ "<tr><td>Statistics</td><td>\nLoading...\n</td></tr>"
      assert html_on_mount =~ "<h2><div class=\"row\"><div class=\"column\">Issues</div>"

      html = render(view)

      assert html =~ "<h1>Project <i>#{@project}</i></h1>"

      assert html =~ "Database documents: 21"
      assert html =~ "Database size: 48.39 KB (49548 bytes)"
      assert html =~ "Original images: 2, size: 697.78 KB (714528 bytes)"
      assert html =~ "Thumbnail images: 2, size: 18.84 KB (19295 bytes)"
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

      assert html =~ "Issues (4)"
    end

    test "user without project authorization can not trigger issue evaluation" do
      {:noreply, socket} =
        ProjectShowLive.handle_event(
          "evaluate_issues",
          nil,
          %Phoenix.LiveView.Socket{
            assigns: %{
              project: @project,
              current_user: "unauthorized"
            }
          }
        )

      assert {:redirect, %{to: "/"}} = socket.redirected
    end

    test "non admin user can not set a new password" do
      new_password = "the_password"

      {:noreply, socket} =
        ProjectShowLive.handle_event(
          "set_password",
          nil,
          %Phoenix.LiveView.Socket{
            assigns: %{
              project: @project,
              current_user: "unauthorized",
              new_password: new_password,
              __changed__: %{},
              flash: %{}
            }
          }
        )

      assert %{assigns: %{flash: %{"error" => "You are not authorized to set the password."}}} =
               socket

      # New password invalid.
      assert {:error, 401} =
               CouchService.authenticate(%CouchService.Credentials{
                 name: @project,
                 password: new_password
               })

      # Old password still valid.
      assert :ok =
               CouchService.authenticate(%CouchService.Credentials{
                 name: @project,
                 password: @user_password
               })
    end

    test "non admin user has no passwort setting interface", %{conn: conn} do
      {:ok, view, _html_on_mount} = live(conn, "/ui/projects/show/#{@project}")
      html = render(view)
      assert not (html =~ "<h2>Password change</h2>")
    end

    test "project document data is displayed in overview", %{conn: conn} do
      {:ok, view, _html_on_mount} = live(conn, "/ui/projects/show/#{@project}")

      html = render(view)

      # These are the current defaults in the mock project based on the Desktop applications `test` project.
      assert html =~ "No supervisor found in project document"
      assert html =~ "No contact data found in project document"
      assert html =~ "<td>Staff</td><td>\nPerson 1, Person 2\n</td>"
    end

    test "missing project document is handled in overview", %{conn: conn} do
      TestHelper.delete_document(@project, "project")

      {:ok, view, _html_on_mount} = live(conn, "/ui/projects/show/#{@project}")

      html = render(view)

      assert html =~ "No supervisor found in project document"
      assert html =~ "No contact data found in project document"
      assert html =~ "No staff names found in project document"
    end

    test "project supervisor is displayed in overview", %{conn: conn} do
      [ok: project_doc] = Project.get_documents(@project, ["project"])

      TestHelper.update_document(
        @project,
        project_doc
        |> Map.update!("resource", fn resource ->
          Map.put(resource, "projectSupervisor", "Ms. Supervisor")
        end)
      )

      {:ok, view, _html_on_mount} = live(conn, "/ui/projects/show/#{@project}")

      html = render(view)

      assert html =~ "<td>Supervisor</td><td>\nMs. Supervisor\n</td>"
    end

    test "project contact is displayed in overview", %{conn: conn} do
      [ok: project_doc] = Project.get_documents(@project, ["project"])

      TestHelper.update_document(
        @project,
        project_doc
        |> Map.update!("resource", fn resource ->
          resource
          |> Map.put("contactPerson", "Mr. Contact")
          |> Map.put("contactMail", "mr.contact@dainst.de")
        end)
      )

      {:ok, view, _html_on_mount} = live(conn, "/ui/projects/show/#{@project}")

      html = render(view)

      assert html =~
               "<td>Contact</td><td>\nMr. Contact (<a href=\"mailto:mr.contact@dainst.de\">mr.contact@dainst.de</a>)\n</td>"
    end

    test "project staff is displayed in overview", %{conn: conn} do
      {:ok, view, _html_on_mount} = live(conn, "/ui/projects/show/#{@project}")

      html = render(view)

      # These are the current defaults in the mock project based on the Desktop applications `test` project.
      assert html =~ "<td>Staff</td><td>\nPerson 1, Person 2\n</td>"
    end
  end

  describe "with logged in admin" do
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

      conn = log_in_user(conn, @admin_user)
      {:ok, %{conn: conn}}
    end

    test "admin has passwort setting interface", %{conn: conn} do
      {:ok, view, _html_on_mount} = live(conn, "/ui/projects/show/#{@project}")

      html = render(view)

      assert html =~ "<h2>Password change</h2>"
    end

    test "password input triggers updated socket", %{conn: conn} do
      {:ok, view, _html_on_mount} = live(conn, "/ui/projects/show/#{@project}")

      html = render(view)

      assert html =~
               "<input type=\"text\" placeholder=\"New password\" id=\"password\" name=\"password\" value=\"\"/></div>"

      # The "Set new password" button should be disabled as long as the input is an empty string.
      assert html =~ "phx-click=\"set_password\" disabled=\"disabled\" style=\"width:100%\""

      html =
        view
        |> element("form")
        |> render_change(%{password: "typed_in_password"})

      assert html =~
               "<input type=\"text\" placeholder=\"New password\" id=\"password\" name=\"password\" value=\"typed_in_password\"/></div>"

      # The "Set new password" button should no longer be disabled.
      assert html =~ "phx-click=\"set_password\" style=\"width:100%\""
    end

    test "button click generates random password", %{conn: conn} do
      {:ok, view, _html_on_mount} = live(conn, "/ui/projects/show/#{@project}")

      html =
        view
        |> render()

      assert html =~
               "<input type=\"text\" placeholder=\"New password\" id=\"password\" name=\"password\" value=\"\"/></div>"

      html =
        view
        |> element("button", "Generate new password")
        |> render_click()

      assert not (html =~
                    "<input type=\"text\" placeholder=\"New password\" id=\"password\" name=\"password\" value=\"\"/></div>")
    end

    test "button click as admin sets current password", %{conn: conn} do
      {:ok, view, _html_on_mount} = live(conn, "/ui/projects/show/#{@project}")

      new_password = "updated_password"

      view
      |> element("form")
      |> render_change(%{password: new_password})

      html =
        view
        |> element("button", "Set new password")
        |> render_click()

      assert html =~ "Successfully updated the password to &#39;#{new_password}&#39;."

      # Old password invalid
      assert {:error, 401} =
               CouchService.authenticate(%CouchService.Credentials{
                 name: @project,
                 password: @user_password
               })

      # New password accepted
      assert :ok =
               CouchService.authenticate(%CouchService.Credentials{
                 name: @project,
                 password: new_password
               })
    end

    test "throws warning if default user is missing", %{conn: conn} do
      # This case is highly unlikely, but is checked by the view nonetheless for completeness sake.

      {:ok, view, _html_on_mount} = live(conn, "/ui/projects/show/#{@project}")

      User.delete(@user_name)

      view
      |> element("form")
      |> render_change(%{password: "updated_password"})

      html =
        view
        |> element("button", "Set new password")
        |> render_click()

      assert html =~
               "Default user for &#39;#{@project}&#39; seems to be missing, unable to set the password."
    end
  end
end
