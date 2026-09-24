defmodule FieldPublicationWeb.Rest.ApiTest do
  use FieldPublicationWeb.ConnCase

  alias FieldPublication.{
    CouchService,
    Project,
    Publication
  }

  alias FieldPublication.Test.ProjectSeed

  @core_database Application.compile_env(:field_publication, :core_database)
  @test_project_identifier "test_project_a"

  setup_all %{} do
    CouchService.put_database(@core_database)

    {project, publication} = ProjectSeed.create_full_publication(@test_project_identifier, true)

    on_exit(fn ->
      Project.get(@test_project_identifier)
      |> case do
        {:ok, %Project{} = project} ->
          Project.delete(project)

        _ ->
          :ok
      end

      CouchService.delete_database(@core_database)
    end)

    image_doc =
      Publication.get_raw_document("project", publication)
      |> Map.get("resource", %{})
      |> Map.get("relations", %{})
      |> Map.get("hasMapLayer", [])
      |> List.first()
      |> Publication.get_raw_document(publication)

    %{project: project, publication: publication, image_doc: image_doc}
  end

  test "returns published iiif image info and data", %{
    conn: conn,
    project: project,
    image_doc: %{"_id" => uuid}
  } do
    identifier = FieldPublicationWeb.Api.IIIFImage.combine_to_identifier(project.identifier, uuid)
    # Try a query for image meta data.
    %{
      "@context" => "http://iiif.io/api/image/3/context.json",
      "id" => "http://localhost:4003" <> path,
      "protocol" => "http://iiif.io/api/image"
    } =
      get(
        conn,
        "/api/iiif/image/v3/#{identifier}/info.json"
      )
      |> json_response(200)

    # Try a query for actual image data.
    assert get(conn, "#{path}/full/max/0/default.jpg")
           |> response(200)
  end
end
