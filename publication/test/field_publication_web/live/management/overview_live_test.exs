defmodule FieldPublicationWeb.Management.OverviewLiveTest do
  use FieldPublicationWeb.ConnCase

  import Phoenix.LiveViewTest
  import FieldPublication.Test.DataScaffolding

  alias FieldPublication.{
    Project,
    User
  }

  setup_all [
    :create_core_database,
    :add_editor_user,
    :add_admin_user,
    :add_projects_and_empty_publications
  ]

  test "user has to be logged in to see the management overview", %{
    conn: conn
  } do
    assert {
             :error,
             {:redirect, %{to: _, flash: %{"error" => "You must log in to access this page."}}}
           } = live(conn, ~p"/management")
  end

  describe "editors" do
    setup %{conn: conn, editor: %User{} = editor} do
      conn = log_in_user(conn, editor.name)
      %{conn: conn}
    end

    test "have access to overview, but only for projects where they are editor", %{
      conn: conn,
      project_a: %Project{} = project_a,
      project_b: %Project{} = project_b
    } do
      {:ok, _live_process, html} = live(conn, ~p"/management")

      refute html =~ "Administration"
      assert html =~ "Projects"
      assert html =~ project_a.identifier
      assert html =~ "Publications (2)"
      assert html =~ project_b.identifier
      # project b has one
      refute html =~ "Publications (1)"
    end

    test "can access their project's draft form", %{conn: conn, project_a: %Project{} = project_a} do
      {:ok, live_process, _html} = live(conn, ~p"/management")

      {:ok, _live_process, html} =
        live_process
        |> element("#project-panel-#{project_a.identifier} a", "Draft new publication")
        |> render_click()
        |> follow_redirect(conn)

      assert html =~ "Create new publication draft"
    end

    test "can neither edit nor delete their project settings", %{
      conn: conn,
      project_a: %Project{} = project_a
    } do
      {:ok, live_process, _html} = live(conn, ~p"/management")

      refute has_element?(live_process, "#project-panel-#{project_a.identifier} a", "Edit")
      refute has_element?(live_process, "#project-panel-#{project_a.identifier} a", "Delete")
    end

    test "has no link to user management", %{conn: conn} do
      {:ok, live_process, _html} = live(conn, ~p"/management")
      refute has_element?(live_process, ~s([href="/management/users"]))
    end
  end

  describe "the administrator" do
    setup %{conn: conn, administrator: %User{name: user_name}} do
      conn = log_in_user(conn, user_name)
      %{conn: conn}
    end

    test "has access to management overview", %{
      conn: conn,
      project_a: %Project{} = project_a,
      project_b: %Project{} = project_b
    } do
      {:ok, _live_process, html} = live(conn, ~p"/management")

      assert html =~ "Administration"
      assert html =~ "Projects"
      assert html =~ project_a.identifier
      assert html =~ "Publications (2)"
      assert html =~ project_b.identifier
      # project b has one
      assert html =~ "Publications (1)"
    end

    test "can not create project with the duplicate name", %{
      conn: conn,
      project_a: %Project{} = project_a
    } do
      {:ok, live_process, _html} = live(conn, ~p"/management")

      {:ok, live_process, _html} =
        live_process
        |> element("a", "Create new project")
        |> render_click()
        |> follow_redirect(conn)

      assert live_process
             |> form("#project-form", project: %{"identifier" => project_a.identifier})
             |> render_submit() =~
               "a project with this identifier already exists, the provided document revision does not match the existing"
    end

    test "can create and delete projects", %{conn: conn} do
      new_project_identifier = "test_temporary"

      {:ok, live_process, _html} = live(conn, ~p"/management")

      {:ok, live_process, html} =
        live_process
        |> element("a", "Create new project")
        |> render_click()
        |> follow_redirect(conn)

      html =~ "Publishing | New Project"

      assert live_process
             |> form("#project-form", project: %{})
             |> render_change() =~ "can&#39;t be blank"

      {:ok, live_process, html} =
        live_process
        |> form("#project-form", project: %{"identifier" => new_project_identifier})
        |> render_submit()
        |> follow_redirect(conn)

      assert html =~ "Project created successfully"
      assert html =~ new_project_identifier

      {:ok, %Project{identifier: new_project_identifier} = _project} =
        Project.get(new_project_identifier)

      live_process
      |> element("#project-panel-#{new_project_identifier} a", "Delete")
      |> render_click()

      html = render(live_process)

      assert not (html =~ new_project_identifier)

      assert {:error, :not_found} = Project.get(new_project_identifier)
    end

    test "can add and remove users to project", %{
      conn: conn,
      project_b: %Project{} = project_b,
      editor: %User{} = editor
    } do
      on_exit(fn ->
        case Project.get(project_b.identifier) do
          {:ok, project} ->
            Project.put(project, %{"editors" => []})

          _ ->
            :ok
        end
      end)

      {:ok, live_process, _html} = live(conn, ~p"/management")

      refute has_element?(
               live_process,
               "#project-panel-#{project_b.identifier}",
               editor.label
             )

      {:ok, live_process, html} =
        live_process
        |> element("#project-panel-#{project_b.identifier} a", "Edit")
        |> render_click()
        |> follow_redirect(conn)

      html =~ "Publishing | Edit Project"

      assert not (live_process
                  |> element(~s{[for="project[editors][]-#{editor.name}"] input})
                  |> render() =~ "checked")

      assert live_process
             |> form("#project-form", project: %{"editors" => [editor.name]})
             |> render_change()

      assert live_process
             |> element(~s{[for="project[editors][]-#{editor.name}"] input})
             |> render() =~ "checked"

      {:ok, live_process, _html} =
        live_process
        |> form("#project-form")
        |> render_submit()
        |> follow_redirect(conn)

      assert has_element?(
               live_process,
               "#project-panel-#{project_b.identifier}",
               editor.label
             )
    end

    test "can access every projects' draft form", %{conn: conn, project_b: %Project{} = project_b} do
      {:ok, live_process, _html} = live(conn, ~p"/management")

      {:ok, live_process, _html} =
        live_process
        |> element("#project-panel-#{project_b.identifier} a", "Draft new publication")
        |> render_click()
        |> follow_redirect(conn)

      assert render(live_process) =~ "Create new publication draft"
    end

    test "has link to navigate to user management", %{conn: conn, editor: %User{} = editor} do
      {:ok, live_process, _html} = live(conn, ~p"/management")

      {:ok, _view, html} =
        live_process
        |> element(~s([href="/management/users"]))
        |> render_click()
        |> follow_redirect(conn)

      assert html =~ "Manage users"
      assert html =~ "<td class=\"text-left\">#{editor.name}</td>"
      assert html =~ "<td class=\"text-left\">#{editor.label}</td>"
    end
  end
end
