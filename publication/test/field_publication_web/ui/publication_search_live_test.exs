defmodule FieldPublicationWeb.UI.PublicationSearchLiveTest do
  use FieldPublicationWeb.ConnCase

  import Phoenix.LiveViewTest
  import FieldPublication.Test.DataScaffolding

  alias FieldPublication.{
    Publication,
    User
  }

  setup_all [
    :create_core_database,
    :add_editor_user,
    :add_admin_user,
    :add_projects_and_publications
  ]

  test "anonymous users can not access publication search still in draft state", %{
    conn: conn,
    unpublished_project_a: %Publication{} = publication
  } do
    assert {:error,
            {:redirect,
             %{flash: %{"error" => "You are not allowed to access that page."}, to: "/"}}} =
             live(
               conn,
               ~p"/projects/search/#{publication.project_identifier}/#{publication.draft_date}"
             )
  end

  test "editors can access publication search still in draft state for projects they are assigned to",
       %{
         conn: conn,
         unpublished_project_a: %Publication{} = publication_a,
         unpublished_project_b: %Publication{} = publication_b,
         editor: %User{name: user_name}
       } do
    conn = log_in_user(conn, user_name)

    assert {:ok, _live, html} =
             live(
               conn,
               ~p"/projects/search/#{publication_a.project_identifier}/#{publication_a.draft_date}"
             )

    html =~
      publication_a.project_label
      |> Enum.find(fn %{language: lang} -> lang == "en" end)
      |> then(fn %{text: text} -> text end)

    assert {:error,
            {:redirect,
             %{flash: %{"error" => "You are not allowed to access that page."}, to: "/"}}} =
             live(
               conn,
               ~p"/projects/search/#{publication_b.project_identifier}/#{publication_b.draft_date}"
             )
  end
end
