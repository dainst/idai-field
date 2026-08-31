defmodule FieldPublicationWeb.Rest.Api.V1.ProjectTest do
  use FieldPublicationWeb.ConnCase

  alias FieldPublication.Publications.Data

  alias FieldPublication.{
    CouchService,
    Projects
  }

  alias FieldPublication.DatabaseSchema.Project

  alias FieldPublication.Test.ProjectSeed

  @core_database Application.compile_env(:field_publication, :core_database)
  @test_project_identifier "test_project_a"

  setup_all %{} do
    CouchService.put_database(@core_database)

    {project, publication} = ProjectSeed.create_full_publication(@test_project_identifier, true)

    on_exit(fn ->
      Projects.get(@test_project_identifier)
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

  test "returns raw image data", %{conn: conn, project: project, image_doc: %{"_id" => uuid}} do
    assert get(conn, ~p"/api/v1/#{project}/image/#{uuid}")
           |> response(200)
  end

  test "returns tile image data", %{conn: conn, project: project, image_doc: %{"_id" => uuid}} do
    assert get(conn, ~p"/api/v1/#{project}/image/#{uuid}/tile/0/0/0")
           |> response(200)
  end
end
