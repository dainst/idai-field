defmodule FieldPublicationWeb.Api.V1.PublicationTest do
  use FieldPublicationWeb.ConnCase

  import FieldPublication.Test.DataScaffolding

  alias FieldPublication.Publication

  alias FieldPublication.Publication.{
    Category,
    Document,
    Field,
    FieldGroup,
    RelationGroup
  }

  setup_all [
    :create_core_database,
    :add_editor_user,
    :add_admin_user,
    :add_projects_and_publications,
    :pick_document
  ]

  def pick_document(%{published_project_a: %Publication{} = publication} = context) do
    [doc] = Publication.get_doc_stream_for_all(publication) |> Enum.take(1)
    Map.put(context, :doc, doc)
  end

  test "returns raw data json for valid url", %{
    conn: conn,
    published_project_a: publication,
    doc: doc
  } do
    assert get(
             conn,
             ~p"/api/v1/#{publication.project_identifier}/#{publication.draft_date}/doc/#{doc["_id"]}"
           )
           |> json_response(200) == doc
  end

  test "returns extended data json for valid url", %{
    conn: conn,
    published_project_a: publication,
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
