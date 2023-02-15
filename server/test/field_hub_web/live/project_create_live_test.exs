defmodule FieldHubWeb.ProjectCreateLiveTest do
  import Phoenix.ConnTest
  import Phoenix.LiveViewTest
  import ExUnit.CaptureLog

  use FieldHubWeb.ConnCase

  alias FieldHubWeb.{
    UserAuth,
    ProjectCreateLive
  }

  alias FieldHub.{
    Project,
    User,
    TestHelper
  }

  @endpoint FieldHubWeb.Endpoint

  @admin_user Application.compile_env(:field_hub, :couchdb_admin_name)
  @project "test_project"

  test "redirect to login if not authenticated", %{conn: conn} do
    # Test the authentication plug (http)
    assert {:error, {:redirect, %{flash: _, to: "/ui/session/new"}}} =
             conn
             |> live("/ui/projects/create")

    # Test the mount function (websocket), this makes sure that users with invalidated/old user token can not
    # access the page.
    socket =
      ProjectCreateLive.mount(
        %{},
        %{"user_token" => "invalid"},
        %Phoenix.LiveView.Socket{}
      )

    assert {:redirect, %{to: "/"}} = socket.redirected
  end

  test "redirect to landing page if not admin", %{conn: conn} do
    non_admin = "some_user"

    # Test the authorization plug (http)
    assert {:error, {:redirect, %{flash: _, to: "/"}}} =
             conn
             |> log_in_user(non_admin)
             |> live("/ui/projects/create")

    # Test the mount function (websocket), this makes sure that users that navigated here from another
    # live view with an existing socket are admins.
    socket =
      ProjectCreateLive.mount(
        %{},
        %{"user_token" => UserAuth.generate_user_session_token(non_admin)},
        %Phoenix.LiveView.Socket{}
      )

    assert {:redirect, %{to: "/"}} = socket.redirected
  end

  describe "with logged in admin" do
    setup %{conn: conn} do
      on_exit(fn ->
        # Run after each tests
        TestHelper.remove_complete_example_project(
          @project,
          @project
        )
      end)

      conn = log_in_user(conn, @admin_user)
      {:ok, %{conn: conn}}
    end

    test "admin can load the page", %{conn: conn} do
      {:ok, view, html_on_mount} = live(conn, "/ui/projects/create")

      assert html_on_mount =~ "<h1>Create a new project</h1>"
      assert html_on_mount =~ "<li>Please provide a project identifier.\n</li>"
      assert html_on_mount =~ "<li>Please provide a password.\n</li>"

      html = render(view)

      assert html =~ "<h1>Create a new project</h1>"
      assert html =~ "<li>Please provide a project identifier.\n</li>"
      assert html =~ "<li>Please provide a password.\n</li>"
    end

    test "valid inputs remove warnings and enable creation button", %{conn: conn} do
      {:ok, view, _html_on_mount} = live(conn, "/ui/projects/create")

      html = render(view)

      assert html =~ "<li>Please provide a project identifier.\n</li>"
      assert html =~ "<li>Please provide a password.\n</li>"

      button_html =
        view
        |> element("button", "Create project")
        |> render()

      assert button_html =~ "disabled=\"disabled\""

      html =
        view
        |> element("form")
        |> render_change(%{name: @project})

      assert not (html =~ "<li>Please provide a project identifier.\n</li>")
      assert html =~ "<li>Please provide a password.\n</li>"

      html =
        view
        |> element("button", "Create project")
        |> render()

      assert html =~ "disabled=\"disabled\""

      html =
        view
        |> element("form")
        |> render_change(%{password: "some_password"})

      assert not (html =~ "<li>Please provide a project identifier.\n</li>")
      assert not (html =~ "<li>Please provide a password.\n</li>")

      button_html =
        view
        |> element("button", "Create project")
        |> render()

      assert not (button_html =~ "disabled=\"disabled\"")

      html =
        view
        |> element("form")
        |> render_change(%{name: ""})

      assert html =~ "<li>Please provide a project identifier.\n</li>"
      assert not (html =~ "<li>Please provide a password.\n</li>")

      html =
        view
        |> element("button", "Create project")
        |> render()

      assert html =~ "disabled=\"disabled\""

      html =
        view
        |> element("form")
        |> render_change(%{password: ""})

      assert html =~ "<li>Please provide a project identifier.\n</li>"
      assert html =~ "<li>Please provide a password.\n</li>"

      html =
        view
        |> element("button", "Create project")
        |> render()

      assert html =~ "disabled=\"disabled\""
    end

    test "can generate password", %{conn: conn} do
      {:ok, view, _html_on_mount} = live(conn, "/ui/projects/create")

      html = render(view)

      assert html =~
               "<input type=\"text\" placeholder=\"Password\" id=\"password\" name=\"password\" value=\"\"/>"

      assert html =~ "<li>Please provide a password.\n</li>"

      html =
        view
        |> element("button", "Generate password")
        |> render_click()

      assert not (html =~ "<li>Please provide a password.\n</li>")

      html =
        view
        |> element("input#password")
        |> render()

      assert not (html =~
                    "<input type=\"text\" placeholder=\"Password\" id=\"password\" name=\"password\" value=\"\"/>")

      assert not (html =~ "<li>Please provide a password.\n</li>")
    end

    test "invalid project identifier results in warning", %{conn: conn} do
      {:ok, view, _html_on_mount} = live(conn, "/ui/projects/create")

      html =
        view
        |> element("form")
        |> render_change(%{name: "123"})

      assert html =~ "Please provide a valid project identifier."
    end

    test "using an existing project identifier results in warning", %{conn: conn} do
      {:ok, view, _html_on_mount} = live(conn, "/ui/projects/create")

      Project.create(@project)

      html =
        view
        |> element("form")
        |> render_change(%{name: @project})

      assert html =~ "This project identifier is already taken."
    end

    test "can create a project", %{conn: conn} do
      {:ok, view, _html_on_mount} = live(conn, "/ui/projects/create")

      html =
        view
        |> element("form")
        |> render_submit(%{name: @project, password: @project})
        |> follow_redirect(conn)
        |> then(fn {:ok, _project_show_view, html_on_mount} ->
          html_on_mount
        end)

      # html should now render the project_show content
      assert html =~ "<h1>Project <i>#{@project}</i></h1>"
      assert html =~ "Statistics"
      assert html =~ "Issues"

      # html should now render the project_show content
      assert html =~
               "Project created project `#{@project}` with password `#{@project}` successfully."
    end

    test "error displayed and logged if project identifier already in use", %{conn: conn} do
      {:ok, view, _html_on_mount} = live(conn, "/ui/projects/create")

      Project.create(@project)

      expected_msg =
        "Error creating `#{@project}`, a database with the identifier already exists."

      log =
        capture_log(fn ->
          html =
            view
            |> element("form")
            |> render_submit(%{name: @project, password: @project})

          assert html =~ expected_msg
        end)

      assert log =~ expected_msg
    end

    test "error displayed and logged if default user already exists", %{conn: conn} do
      {:ok, view, _html_on_mount} = live(conn, "/ui/projects/create")

      User.create(@project, "password")

      expected_msg = "Error creating default user `#{@project}`, the user already exists."

      log =
        capture_log(fn ->
          html =
            view
            |> element("form")
            |> render_submit(%{name: @project, password: @project})

          assert html =~ expected_msg
        end)

      assert log =~ expected_msg
    end
  end

  test "non admin can not trigger project creation" do
    {:noreply, socket} =
      ProjectCreateLive.handle_event(
        "create",
        %{"name" => @project, "password" => "some_password"},
        %Phoenix.LiveView.Socket{
          assigns: %{
            current_user: @project
          }
        }
      )

    assert {:redirect, %{to: "/"}} = socket.redirected
  end
end
