defmodule FieldPublicationWeb.Rest.Api.V1.PublicationTest do
  use FieldPublicationWeb.ConnCase

  alias FieldPublication.{
    CouchService,
    Project,
    Publication
  }

  alias FieldPublication.Publication.{
    Category,
    Document,
    Field,
    FieldGroup,
    RelationGroup
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

    [doc] = Publication.get_doc_stream_for_all(publication) |> Enum.take(1)

    %{project: project, publication: publication, doc: doc}
  end

  test "returns raw data json for valid url", %{conn: conn, publication: publication, doc: doc} do
    assert get(
             conn,
             ~p"/api/v1/#{publication.project_identifier}/#{publication.draft_date}/doc/#{doc["_id"]}"
           )
           |> json_response(200) == doc
  end

  test "returns extended data json for valid url", %{
    conn: conn,
    publication: publication,
    doc: doc
  } do
    assert %Document{} =
             extended_doc =
             get(
               conn,
               ~p"/api/v1/#{publication.project_identifier}/#{publication.draft_date}/doc/#{doc["_id"]}/extended"
             )
             |> json_response(200)
             |> Document.from_map()

    assert extended_doc.id == doc["_id"]

    # Check if the nested structure of document matches the expectations.

    assert %Category{} = extended_doc.category

    assert Enum.count(extended_doc.groups) > 0

    assert Enum.map(
             extended_doc.groups,
             fn %FieldGroup{fields: fields} = _group ->
               assert Enum.count(fields) > 0

               Enum.map(
                 fields,
                 fn %Field{} = _field ->
                   :ok
                 end
               )
             end
           )

    assert Enum.count(extended_doc.relations) > 0

    assert Enum.map(
             extended_doc.relations,
             fn %RelationGroup{docs: docs} ->
               assert Enum.count(docs) > 0

               Enum.map(
                 docs,
                 fn %Document{} = _doc ->
                   :ok
                 end
               )
             end
           )
  end
end
