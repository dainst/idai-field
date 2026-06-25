defmodule FieldPublicationWeb.Rest.Api.JsonTest do
  use FieldPublicationWeb.ConnCase

  alias FieldPublication.Publications.Data

  alias FieldPublication.{
    CouchService,
    Projects,
    Publications
  }

  alias FieldPublication.DatabaseSchema.Project

  alias FieldPublication.Test.ProjectSeed

  @core_database Application.compile_env(:field_publication, :core_database)
  @test_project_name "test_project_a"
  @private_project_name "test_project_private"

  setup_all %{} do
    CouchService.put_database(@core_database)

    {project, publication} = ProjectSeed.start(@test_project_name, false)
    {_private_project, private_publication} = ProjectSeed.start(@private_project_name, false)
    {:ok, private_publication} = Publications.put(private_publication, %{"publication_date" => nil})

    on_exit(fn ->
      [@test_project_name, @private_project_name]
      |> Enum.each(fn project_name ->
        Projects.get(project_name)
        |> case do
          {:ok, %Project{} = project} ->
            Projects.delete(project)

          _ ->
            :ok
        end
      end)

      CouchService.delete_database(@core_database)
    end)

    [doc] = Data.get_doc_stream_for_all(publication) |> Enum.take(1)
    [private_doc] = Data.get_doc_stream_for_all(private_publication) |> Enum.take(1)

    %{
      project: project,
      publication: publication,
      doc: doc,
      private_publication: private_publication,
      private_doc: private_doc
    }
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

  test "rejects json requests for unpublished publications without project access", %{
    conn: conn,
    private_publication: publication,
    private_doc: doc
  } do
    assert get(
             conn,
             ~p"/api/json/raw/#{publication.project_name}/#{publication.draft_date}/#{doc["_id"]}"
           )
           |> response(403) == "You are not allowed to access that page."
  end

  test "rejects extended json requests for unpublished publications without project access", %{
    conn: conn,
    private_publication: publication,
    private_doc: doc
  } do
    assert get(
             conn,
             ~p"/api/json/extended/#{publication.project_name}/#{publication.draft_date}/#{doc["_id"]}"
           )
           |> response(403) == "You are not allowed to access that page."
  end
end
