defmodule FieldPublicationWeb.Live.Presentation.PublicationDataTest do
  use FieldPublicationWeb.ConnCase
  import Phoenix.LiveViewTest

  test "field variants are all rendered correctly", %{
    conn: conn
  } do
    assert {:ok, _live_view_pid, html} = live(conn, ~p"/dev/field_render")

    refute html =~ "Unhandled input type"
  end
end
