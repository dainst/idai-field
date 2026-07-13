defmodule FieldPublicationWeb.Management.OverviewLiveTest do
  alias FieldPublication.Projects
  alias FieldPublication.CouchService
  alias FieldPublication.DatabaseSchema.Project

  use FieldPublicationWeb.ConnCase

  import Phoenix.LiveViewTest

  @core_database Application.compile_env(:field_publication, :core_database)
  @test_project_identifier "test_project_a"
  @test_user %FieldPublication.DatabaseSchema.User{
    name: "test_user",
    password: "pw",
    label: "Test user"
  }
  @new_project_identifier "test_project_b"

  setup_all do
    CouchService.put_database(@core_database)
    CouchService.create_user(@test_user)

    Projects.put(%Project{}, %{"identifier" => @test_project_identifier})

    project = Projects.get!(@test_project_identifier)

    on_exit(fn ->
      Projects.delete(project)
      CouchService.delete_database(@core_database)
      CouchService.delete_user(@test_user.name)
    end)

    %{test_project: project}
  end

  test "user has to be logged in to see the management overview", %{
    conn: conn
  } do
    assert {
             :error,
             {:redirect, %{to: _, flash: %{"error" => "You must log in to access this page."}}}
           } = live(conn, ~p"/management")
  end

  describe "editors" do
    setup %{conn: conn} do
      conn = log_in_user(conn, @test_user.name)

      Projects.put(%Project{}, %{
        "identifier" => @new_project_identifier,
        "editors" => [@test_user.name]
      })

      on_exit(fn ->
        Projects.get(@new_project_identifier)
        |> case do
          {:ok, project} ->
            Projects.delete(project)

          _ ->
            :ok
        end
      end)

      %{conn: conn}
    end

    test "have access to management overview, but only for projects where they are editor", %{
      conn: conn
    } do
      {:ok, _live_process, html} = live(conn, ~p"/management")

      refute html =~ "Administration"
      assert html =~ "Projects"
      refute html =~ @test_project_identifier
      assert html =~ @new_project_identifier
    end

    test "can access their project's draft form", %{conn: conn} do
      {:ok, live_process, _html} = live(conn, ~p"/management")

      {:ok, _live_process, html} =
        live_process
        |> element("#project-panel-#{@new_project_identifier} a", "Draft new publication")
        |> render_click()
        |> follow_redirect(conn)

      assert html =~ "Create new publication draft"
    end

    test "can neither edit nor delete their project settings", %{conn: conn} do
      {:ok, live_process, _html} = live(conn, ~p"/management")

      assert not has_element?(live_process, "#project-panel-#{@new_project_identifier} a", "Edit")

      assert not has_element?(
               live_process,
               "#project-panel-#{@new_project_identifier} a",
               "Delete"
             )
    end

    test "has no link to user management", %{conn: conn} do
      {:ok, live_process, _html} = live(conn, ~p"/management")
      assert not has_element?(live_process, ~s([href="/management/users"]))
    end
  end

  describe "the administrator" do
    setup %{conn: conn} do
      conn = log_in_user(conn, Application.get_env(:field_publication, :couchdb_admin_name))

      on_exit(fn ->
        Projects.get(@new_project_identifier)
        |> case do
          {:ok, project} ->
            Projects.delete(project)

          _ ->
            :ok
        end
      end)

      %{conn: conn}
    end

    test "has access to management overview", %{conn: conn, test_project: project} do
      {:ok, _live_process, html} = live(conn, ~p"/management")

      assert html =~ "Administration"
      assert html =~ project.identifier
      assert html =~ "Publications (0)"
    end

    test "can not create project with the duplicate name", %{conn: conn} do
      {:ok, live_process, _html} = live(conn, ~p"/management")

      {:ok, live_process, _html} =
        live_process
        |> element("a", "Create new project")
        |> render_click()
        |> follow_redirect(conn)

      assert live_process
             |> form("#project-form", project: %{"identifier" => @test_project_identifier})
             |> render_submit() =~
               "a project with this identifier already exists, the provided document revision does not match the existing"
    end

    test "can create and delete projects", %{conn: conn} do
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
        |> form("#project-form", project: %{"identifier" => @new_project_identifier})
        |> render_submit()
        |> follow_redirect(conn)

      assert html =~ "Project created successfully"
      assert html =~ @new_project_identifier

      {:ok, %Project{identifier: @new_project_identifier} = _project} =
        Projects.get(@new_project_identifier)

      live_process
      |> element("#project-panel-#{@new_project_identifier} a", "Delete")
      |> render_click()

      html = render(live_process)

      assert not (html =~ @new_project_identifier)

      assert {:error, :not_found} = Projects.get(@new_project_identifier)
    end

    test "can add and remove users to project", %{conn: conn} do
      on_exit(fn ->
        case Projects.get(@test_project_identifier) do
          {:ok, project} ->
            Projects.put(project, %{"editors" => []})

          _ ->
            :ok
        end
      end)

      {:ok, live_process, _html} = live(conn, ~p"/management")

      assert not has_element?(
               live_process,
               "#project-panel-#{@test_project_identifier}",
               @test_user.label
             )

      {:ok, live_process, html} =
        live_process
        |> element("#project-panel-#{@test_project_identifier} a", "Edit")
        |> render_click()
        |> follow_redirect(conn)

      html =~ "Publishing | Edit Project"

      assert not (live_process
                  |> element(~s{[for="project[editors][]-test_user"] input})
                  |> render() =~ "checked")

      assert live_process
             |> form("#project-form", project: %{"editors" => [@test_user.name]})
             |> render_change()

      assert live_process
             |> element(~s{[for="project[editors][]-test_user"] input})
             |> render() =~ "checked"

      {:ok, live_process, _html} =
        live_process
        |> form("#project-form")
        |> render_submit()
        |> follow_redirect(conn)

      assert has_element?(
               live_process,
               "#project-panel-#{@test_project_identifier}",
               @test_user.label
             )
    end

    test "can access every projects' draft form", %{conn: conn} do
      {:ok, live_process, _html} = live(conn, ~p"/management")

      {:ok, live_process, _html} =
        live_process
        |> element("#project-panel-#{@test_project_identifier} a", "Draft new publication")
        |> render_click()
        |> follow_redirect(conn)

      assert render(live_process) =~ "Create new publication draft"
    end

    test "has link to navigate to user management", %{conn: conn} do
      {:ok, live_process, _html} = live(conn, ~p"/management")

      {:ok, _view, html} =
        live_process
        |> element(~s([href="/management/users"]))
        |> render_click()
        |> follow_redirect(conn)

      assert html =~ "Manage users"
      assert html =~ "<td class=\"text-left\">#{@test_user.name}</td>"
      assert html =~ "<td class=\"text-left\">#{@test_user.label}</td>"
    end
  end
end
