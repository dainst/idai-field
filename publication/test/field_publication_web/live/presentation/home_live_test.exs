defmodule FieldPublicationWeb.Presentation.HomeLiveTest do
  use FieldPublicationWeb.ConnCase

  import Phoenix.LiveViewTest
  import FieldPublication.Test.DataScaffolding

  alias FieldPublication.{
    Publication,
    User
  }

  alias FieldPublicationWeb.Presentation.HomeLive

  setup_all [
    :create_core_database,
    :add_editor_user,
    :add_admin_user,
    :add_projects_and_empty_publications
  ]

  test "project link renders also if no label is set" do
    # Normally the link will be generated using the translated `project_label` of the publication, using the
    # identifier is the fallback.
    identifier = "some_id"

    html =
      render_component(
        &HomeLive.publication_link/1,
        %{
          publication: %Publication{
            project_identifier: identifier,
            project_label: []
          }
        }
      )

    assert html =~ "<a href=\"/projects/#{identifier}\""
  end

  test "anonymous users can only see published project in project list", %{
    conn: conn,
    published_project_a: published_project_a,
    unpublished_project_a: unpublished_project_a,
    unpublished_project_b: unpublished_project_b
  } do
    assert {:ok, _live_view_pid, html} = live(conn, ~p"/")

    assert html =~ "href=\"/search\""

    assert html =~
             published_project_a.project_label
             |> Enum.find(fn %{language: language} -> language == "en" end)
             |> then(fn %{text: text} -> text end)

    assert html =~ "href=\"/projects/#{published_project_a.project_identifier}\""

    refute html =~
             unpublished_project_a.project_label
             |> Enum.find(fn %{language: language} -> language == "en" end)
             |> then(fn %{text: text} -> text end)

    refute html =~
             unpublished_project_b.project_label
             |> Enum.find(fn %{language: language} -> language == "en" end)
             |> then(fn %{text: text} -> text end)

    refute html =~ "href=\"/projects/#{unpublished_project_b.project_identifier}\""
  end

  test "editor users can only see published project in project list", %{
    conn: conn,
    editor: %User{name: editor_name},
    published_project_a: published_project_a,
    unpublished_project_a: unpublished_project_a,
    unpublished_project_b: unpublished_project_b
  } do
    assert {:ok, _live_view_pid, html} = conn |> log_in_user(editor_name) |> live(~p"/")

    assert html =~ "href=\"/search\""

    assert html =~
             published_project_a.project_label
             |> Enum.find(fn %{language: language} -> language == "en" end)
             |> then(fn %{text: text} -> text end)

    assert html =~ "href=\"/projects/#{published_project_a.project_identifier}\""

    refute html =~
             unpublished_project_a.project_label
             |> Enum.find(fn %{language: language} -> language == "en" end)
             |> then(fn %{text: text} -> text end)

    refute html =~
             unpublished_project_b.project_label
             |> Enum.find(fn %{language: language} -> language == "en" end)
             |> then(fn %{text: text} -> text end)

    refute html =~ "href=\"/projects/#{unpublished_project_b.project_identifier}\""
  end

  test "admin users can only see published project in project list", %{
    conn: conn,
    administrator: %User{name: admin_name},
    published_project_a: published_project_a,
    unpublished_project_a: unpublished_project_a,
    unpublished_project_b: unpublished_project_b
  } do
    assert {:ok, _live_view_pid, html} = conn |> log_in_user(admin_name) |> live(~p"/")

    assert html =~ "href=\"/search\""

    assert html =~
             published_project_a.project_label
             |> Enum.find(fn %{language: language} -> language == "en" end)
             |> then(fn %{text: text} -> text end)

    assert html =~ "href=\"/projects/#{published_project_a.project_identifier}\""

    refute html =~
             unpublished_project_a.project_label
             |> Enum.find(fn %{language: language} -> language == "en" end)
             |> then(fn %{text: text} -> text end)

    refute html =~
             unpublished_project_b.project_label
             |> Enum.find(fn %{language: language} -> language == "en" end)
             |> then(fn %{text: text} -> text end)

    refute html =~ "href=\"/projects/#{unpublished_project_b.project_identifier}\""
  end
end

defmodule FieldPublicationWeb.Presentation.HomeLiveTest.EmptySystem do
  use FieldPublicationWeb.ConnCase

  import Phoenix.LiveViewTest
  import FieldPublication.Test.DataScaffolding

  alias FieldPublication.User

  setup_all [:create_core_database, :add_editor_user, :add_admin_user]

  test "in an empty system anonymous users can see landing page", %{conn: conn} do
    assert {:ok, _live_view_pid, html} = live(conn, ~p"/")

    assert html =~ "No data published yet"
  end

  test "editor users can see landing page", %{
    conn: conn,
    editor: %User{name: editor_name}
  } do
    assert {:ok, _live_view_pid, html} = conn |> log_in_user(editor_name) |> live(~p"/")

    assert html =~
             "Go to <a href=\"/management\" data-phx-link=\"redirect\" data-phx-link-state=\"push\">management</a> to manage publications for your project(s)."
  end

  test "admin users can see landing page", %{
    conn: conn,
    administrator: %User{name: admin_name}
  } do
    assert {:ok, _live_view_pid, html} = conn |> log_in_user(admin_name) |> live(~p"/")

    assert html =~
             "Go to <a href=\"/management\" data-phx-link=\"redirect\" data-phx-link-state=\"push\">management</a> to setup projects, add editors and prepare first associated publications."
  end

  # setup_all %{} do
  #   CouchService.put_database(@core_database)

  #   {project, publication} = ProjectSeed.create_full_publication(@test_project_identifier, true)

  #   on_exit(fn ->
  #     Project.get(@test_project_identifier)
  #     |> case do
  #       {:ok, %Project{} = project} ->
  #         Project.delete(project)

  #       _ ->
  #         :ok
  #     end

  #     CouchService.delete_database(@core_database)
  #   end)

  #   %{project: project, publication: publication}
  # end

  # test "everybody can see the list of published projects and navigate to the project document", %{
  #   conn: conn,
  #   publication: publication
  # } do
  #   assert {:ok, live_view_pid, html} = live(conn, ~p"/")

  #   assert html =~ "Projects"

  #   {:ok, doc} = Publication.get_extended_document("project", publication)

  #   short_description = Document.get_field_value(doc, "shortName") |> Map.get("en")

  #   assert html =~ short_description

  #   assert live_view_pid
  #          |> element("a", short_description)
  #          |> render_click()

  #   {path, _flash} = assert_redirect(live_view_pid)

  #   conn = recycle(conn)

  #   assert {:error, {:live_redirect, %{to: path_with_date_and_language_selection}}} =
  #            live(conn, path)

  #   conn = recycle(conn)

  #   assert {:ok, _live_view_pid, project_doc_html} =
  #            live(conn, path_with_date_and_language_selection)

  #   assert project_doc_html =~ short_description
  #   assert project_doc_html =~ "Institution"
  #   assert project_doc_html =~ "Supervisor"
  # end

  # test "everybody can see the list of published projects navigate to the system wide search", %{
  #   conn: conn
  # } do
  #   assert {:ok, live_view_pid, html} = live(conn, ~p"/")

  #   assert html =~ "Search"

  #   assert live_view_pid
  #          |> element("a", "Search all projects")
  #          |> render_click()

  #   {path, _flash} = assert_redirect(live_view_pid)

  #   conn = recycle(conn)

  #   assert {:ok, _live_view, search_doc_html} =
  #            live(conn, path)

  #   assert search_doc_html =~ "Searching..."
  # end
end
