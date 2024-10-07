defmodule FieldPublicationWeb.Rest.Api.ImageTest do
  use FieldPublicationWeb.ConnCase

  alias FieldPublication.Publications.Data

  alias FieldPublication.{
    CouchService,
    Projects
  }

  alias FieldPublication.DatabaseSchema.Project

  alias FieldPublication.Test.ProjectSeed

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

    image_doc =
      Data.get_raw_document("project", publication)
      |> Map.get("resource", %{})
      |> Map.get("relations", %{})
      |> Map.get("hasMapLayer", [])
      |> List.first()
      |> Data.get_raw_document(publication)

    %{project: project, publication: publication, image_doc: image_doc}
  end

  test "returns published iiif image info and data from cantaloupe", %{
    conn: conn,
    project: project,
    image_doc: %{"_id" => uuid}
  } do
    # Try a query for image meta data.
    %{
      "@context" => "http://iiif.io/api/image/3/context.json",
      "id" => "http://www.example.com:4001" <> path,
      "protocol" => "http://iiif.io/api/image"
    } =
      get(
        conn,
        "/api/image/iiif/3/#{project.name}%2F#{uuid}.jp2/info.json"
      )
      |> json_response(200)

    # Try a query for actual image data.
    assert get(conn, "#{path}/full/max/0/default.jpg")
           |> response(200)
  end

  test "returns raw image data", %{conn: conn, project: project, image_doc: %{"_id" => uuid}} do
    assert get(conn, ~p"/api/image/raw/#{project}/#{uuid}")
           |> response(200)
  end

  test "returns tile image data", %{conn: conn, project: project, image_doc: %{"_id" => uuid}} do
    assert get(conn, ~p"/api/image/tile/#{project}/#{uuid}/0/0/0")
           |> response(200)
  end
end
