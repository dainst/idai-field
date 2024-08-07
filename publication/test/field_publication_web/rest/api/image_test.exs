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

    image_categories = Data.get_all_subcategories(publication, "Image")

    image_docs =
      publication
      |> Data.get_doc_stream_for_categories(image_categories)
      |> Enum.to_list()

    %{project: project, publication: publication, image_docs: image_docs}
  end

  test "returns published iiif image info", %{conn: conn, project: project, image_docs: docs} do
    %{"_id" => uuid} = List.first(docs)

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
           |> is_binary()
  end
end
