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

    # Check if the nested structure of document matches the expectations.

    assert %Data.Category{} = extended_doc.category

    assert Enum.count(extended_doc.groups) > 0

    assert Enum.map(
             extended_doc.groups,
             fn %Data.FieldGroup{fields: fields} = group ->
               assert Enum.count(fields) > 0

               Enum.map(
                 fields,
                 fn %Data.Field{} = field ->
                   :ok
                 end
               )
             end
           )

    assert Enum.count(extended_doc.relations) > 0

    assert Enum.map(
             extended_doc.relations,
             fn %Data.RelationGroup{docs: docs} ->
               assert Enum.count(docs) > 0

               Enum.map(
                 docs,
                 fn %Data.Document{} = doc ->
                   :ok
                 end
               )
             end
           )
  end
end
