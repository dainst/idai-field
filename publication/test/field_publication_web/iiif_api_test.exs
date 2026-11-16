defmodule FieldPublicationWeb.IIIFApiTest do
  use FieldPublicationWeb.ConnCase

  import FieldPublication.Test.DataScaffolding

  alias FieldPublication.Project

  setup_all [
    :create_core_database,
    :add_editor_user,
    :add_admin_user,
    :add_projects_and_publications,
    :pick_map_layer_image
  ]

  test "returns published iiif image info and data", %{
    conn: conn,
    project_a: %Project{} = project,
    image_doc: %{"_id" => uuid}
  } do
    iiif_identifier =
      FieldPublicationWeb.Api.IIIFImage.combine_to_identifier(project.identifier, uuid)

    # Try a query for image meta data.
    %{
      "@context" => "http://iiif.io/api/image/3/context.json",
      "id" => "http://localhost:4003" <> path,
      "protocol" => "http://iiif.io/api/image"
    } =
      get(
        conn,
        "/api/iiif/image/v3/#{iiif_identifier}/info.json"
      )
      |> json_response(200)

    # Try a query for actual image data.
    assert get(conn, "#{path}/full/max/0/default.jpg")
           |> response(200)
  end
end
