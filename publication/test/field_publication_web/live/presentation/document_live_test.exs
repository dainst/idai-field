defmodule FieldPublicationWeb.Presentation.DocumentLiveTest do
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

  test "the project document is rendered and we can navigate to a top level document", %{
    conn: conn,
    publication: publication
  } do
    assert {:ok, live_view_pid, html} =
             live(conn, ~p"/projects/#{publication.project_name}/#{publication.draft_date}/en")

    doc = Data.get_document("project", publication)
    short_description = Data.get_field_values(doc, "shortName") |> Map.get("en")

    assert html =~ short_description
    assert html =~ "Institution"
    assert html =~ "Supervisor"

    # Project description text
    assert html =~
             "This example project serves as a point of entry for people new to the application."

    # Publication comment text
    assert html =~ "This is a publication created by Field Publication’s seed.exs."

    place_html =
      live_view_pid
      |> element(
        ~s{[href="/projects/#{publication.project_name}/#{publication.draft_date}/en/19bc503f-7ddf-4e44-93d4-7b45108f0d84"]}
      )
      |> render_click()

    assert place_html =~ "Siedlung"
    assert place_html =~ "(Polygon)"

    # Child documents
    assert place_html =~ "TTP Trench A"
    assert place_html =~ "TTP Trench B"
    assert place_html =~ "TTP Trench C"
    assert place_html =~ "TTP Survey 1"
  end

  test "image document gets rendered", %{
    conn: conn,
    publication: publication
  } do
    assert {:ok, _live_view_pid, html} =
             live(
               conn,
               ~p"/projects/#{publication.project_name}/#{publication.draft_date}/en/9579212f-6342-49bd-900f-e13fd70f6a80"
             )

    assert html =~ "Depicts"
    assert html =~ "3888"
    assert html =~ "5184"
  end
end
