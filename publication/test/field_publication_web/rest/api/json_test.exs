defmodule FieldPublicationWeb.Rest.Api.JsonTest do
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

    {project, publication} = ProjectSeed.start(@test_project_name, false)

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

    [doc] = Data.get_doc_stream_for_all(publication) |> Enum.take(1)

    %{project: project, publication: publication, doc: doc}
  end

  test "returns raw data json for valid url", %{conn: conn, publication: publication, doc: doc} do
    assert get(
             conn,
             ~p"/api/json/raw/#{publication.project_name}/#{publication.draft_date}/#{doc["_id"]}"
           )
           |> json_response(200) == doc
  end

  test "returns extended data json for valid url", %{
    conn: conn,
    publication: publication,
    doc: doc
  } do
    assert %Data.Document{} =
             extended_doc =
             get(
               conn,
               ~p"/api/json/extended/#{publication.project_name}/#{publication.draft_date}/#{doc["_id"]}"
             )
             |> json_response(200)
             |> Data.document_map_to_struct()

    assert extended_doc.id == doc["_id"]
  end
end
