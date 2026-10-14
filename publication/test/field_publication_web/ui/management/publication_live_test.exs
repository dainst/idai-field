defmodule FieldPublicationWeb.UI.Management.PublicationLiveTest do
  use FieldPublicationWeb.ConnCase

  import Phoenix.LiveViewTest
  import FieldPublication.Test.DataScaffolding

  alias FieldPublication.{
    Project,
    User
  }

  setup_all [
    :create_core_database,
    :add_editor_user,
    :add_admin_user,
    :add_projects_and_empty_publications
  ]

  test "no access to publication creation form without authentication", %{
    conn: conn,
    project_b: %Project{identifier: identifier}
  } do
    # Error without authentication.
    assert {
             :error,
             {:redirect,
              %{to: _, flash: %{"error" => "You are not allowed to access that page."}}}
           } = live(conn, ~p"/management/projects/#{identifier}/publication/new")
  end

  test "no access to publication creation form without authorization", %{
    conn: conn,
    editor: %User{name: user_name},
    project_b: %Project{identifier: identifier, editors: editors}
  } do
    log_in_user(conn, user_name)

    refute user_name == Enum.find(editors, fn val -> val == user_name end)

    # Error for logged in user that is not defined as project editor
    assert {
             :error,
             {:redirect,
              %{to: _, flash: %{"error" => "You are not allowed to access that page."}}}
           } = live(conn, ~p"/management/projects/#{identifier}/publication/new")
  end

  test "project editors have access to the publication creation form", %{
    conn: conn,
    editor: %User{name: user_name},
    project_a: %Project{identifier: identifier, editors: editors}
  } do
    conn = log_in_user(conn, user_name)

    assert user_name == Enum.find(editors, fn val -> val == user_name end)

    assert {:ok, _live_process, html} =
             live(conn, ~p"/management/projects/#{identifier}/publication/new")

    assert html =~ "Create new publication draft"
  end

  test "administrators have always access to the publication creation form", %{
    conn: conn,
    administrator: %User{} = admin,
    project_a: %Project{identifier: identifier_a},
    project_b: %Project{identifier: identifier_b}
  } do
    conn = log_in_user(conn, admin.name)

    assert {:ok, _live_process, html} =
             live(conn, ~p"/management/projects/#{identifier_a}/publication/new")

    assert html =~ "Create new publication draft"

    assert {:ok, _live_process, html} =
             live(conn, ~p"/management/projects/#{identifier_b}/publication/new")

    assert html =~ "Create new publication draft"
  end
end
