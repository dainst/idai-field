defmodule FieldPublicationWeb.Api.V1.ProjectTest do
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

  test "returns raw image data", %{
    conn: conn,
    project_a: %Project{} = project,
    image_doc: %{"_id" => uuid}
  } do
    # TODO: Actually check image data
    assert get(conn, ~p"/api/v1/#{project.identifier}/image/#{uuid}")
           |> response(200)
  end

  test "returns tile image data", %{
    conn: conn,
    project_a: %Project{} = project,
    image_doc: %{"_id" => uuid}
  } do
    # TODO: Actually check image data
    assert get(conn, ~p"/api/v1/#{project.identifier}/image/#{uuid}/tile/0/0/0")
           |> response(200)
  end
end
