defmodule FieldPublicationWeb.Presentation.HomeLiveTest do
  use FieldPublicationWeb.ConnCase

  alias FieldPublication.Publications.Data

  alias FieldPublication.{
    CouchService,
    Projects
  }

  alias FieldPublication.DocumentSchema.Project

  alias FieldPublication.Test.ProjectSeed

  import Phoenix.LiveViewTest
  @core_database Application.compile_env(:field_publication, :core_database)
  @test_project_name "test_project_a"

  setup_all %{} do
    CouchService.put_database(@core_database)

    {project, publication} = ProjectSeed.start(@test_project_name)

    on_exit(fn ->
      Projects.get(@test_project_name)
      |> case do
        {:ok, %Project{} = project} ->
          Projects.delete(project)

        _ ->
          :ok
      end

      CouchService.delete_database(@core_database)
    end)

    %{project: project, publication: publication}
  end

  test "everybody can see the list of published projects and navigate to the project document", %{
    conn: conn,
    publication: publication
  } do
    assert {:ok, live_view_pid, html} = live(conn, ~p"/")

    assert html =~ "Projects"

    doc = Data.get_extended_document("project", publication)

    short_description = Data.get_field_value(doc, "shortName") |> Map.get("en")

    assert html =~ short_description

    assert live_view_pid
           |> element("a", short_description)
           |> render_click()

    {path, _flash} = assert_redirect(live_view_pid)

    conn = recycle(conn)

    assert {:error, {:live_redirect, %{to: path_with_date_and_language_selection}}} =
             live(conn, path)

    conn = recycle(conn)

    assert {:ok, _live_view_pid, project_doc_html} =
             live(conn, path_with_date_and_language_selection)

    assert project_doc_html =~ short_description
    assert project_doc_html =~ "Institution"
    assert project_doc_html =~ "Supervisor"
  end

  test "everybody can see the list of published projects navigate to the system wide search", %{
    conn: conn
  } do
    assert {:ok, live_view_pid, html} = live(conn, ~p"/")

    assert html =~ "Search"

    assert live_view_pid
           |> element("a", "Search projects")
           |> render_click()

    {path, _flash} = assert_redirect(live_view_pid)

    conn = recycle(conn)

    assert {:ok, _live_view_pid, search_doc_html} =
             live(conn, path)

    assert search_doc_html =~ "Search | FieldPublication"
    assert search_doc_html =~ "hits"
    assert search_doc_html =~ "Active filters"
    assert search_doc_html =~ "Available filters"
  end
end
