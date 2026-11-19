defmodule FieldPublicationWeb.UI.SearchLiveTest do
  use FieldPublicationWeb.ConnCase

  import Phoenix.LiveViewTest
  import FieldPublication.Test.DataScaffolding

  setup_all [
    :create_core_database,
    :add_editor_user,
    :add_admin_user,
    :add_projects_and_publications
  ]

  test "anonymous user can use system wide search", %{conn: conn} do
    assert {:ok, live, html} =
             live(
               conn,
               ~p"/search"
             )

    assert html =~ "Searching..."

    html = render_async(live)

    assert html =~ "Found 59 matches."
  end

  test "user provide search terms", %{conn: conn} do
    assert {:ok, live, _html} =
             live(
               conn,
               ~p"/search"
             )

    html = render_async(live)

    assert html =~ "Found 59 matches."

    _html =
      form(
        live,
        ~s(#system_search_input)
      )
      |> render_change(%{search_input: "unklar"})

    html = render_async(live)

    assert html =~ "Found 2 matches."

    _html =
      form(
        live,
        ~s(#system_search_input)
      )
      |> render_change(%{search_input: ""})

    html = render_async(live)

    assert html =~ "Found 59 matches."
  end

  test "user can toggle provided filters", %{conn: conn} do
    assert {:ok, live, _html} =
             live(
               conn,
               ~p"/search"
             )

    html = render_async(live)

    assert html =~ "Found 59 matches."

    _html =
      element(
        live,
        ~s(div[phx-click="toggle_filter"][phx-value-key="category"][phx-value-value="Trench"])
      )
      |> render_click()

    html = render_async(live)

    assert html =~ "Found 3 matches."

    _html =
      element(
        live,
        ~s(div[phx-click="toggle_filter"][phx-value-key="category"][phx-value-value="Trench"])
      )
      |> render_click()

    html = render_async(live)

    assert html =~ "Found 59 matches."
  end
end
