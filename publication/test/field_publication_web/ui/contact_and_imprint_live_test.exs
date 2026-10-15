defmodule FieldPublicationWeb.UI.ContactAndImprintLiveTest do
  use FieldPublicationWeb.ConnCase

  import Phoenix.LiveViewTest
  import FieldPublication.Test.DataScaffolding

  alias FieldPublication.ApplicationSettings

  setup_all [
    :create_core_database,
    :add_editor_user,
    :add_admin_user
  ]

  @missing_imprint_warning "No imprint defined."
  @missing_contact_email_warning "No contact email defined."
  @settings_label "Open settings"

  test "missing contact and imprint show warnings", %{
    conn: conn
  } do
    assert {:ok, _live_view_pid, html} =
             live(conn, ~p"/imprint")

    assert html =~ @missing_imprint_warning
    assert html =~ @missing_contact_email_warning

    refute html =~ @settings_label
  end

  test "missing contact and imprint shows only warnings for editor", %{
    conn: conn,
    editor: editor
  } do
    conn = log_in_user(conn, editor.name)

    assert {:ok, _live_view_pid, html} =
             live(conn, ~p"/imprint")

    assert html =~ @missing_imprint_warning
    assert html =~ @missing_contact_email_warning

    refute html =~ @settings_label
  end

  test "missing contact and imprint shows link to settings for administrators", %{
    conn: conn,
    administrator: administrator
  } do
    conn = log_in_user(conn, administrator.name)

    assert {:ok, _live_view_pid, html} =
             live(conn, ~p"/imprint")

    assert html =~ @missing_imprint_warning
    assert html =~ @missing_contact_email_warning

    assert html =~ @settings_label
  end

  test "imprint setting is displayed and language can be toggled", %{conn: conn} do
    english_imprint = "In English"
    german_imprint = "Auf Deutsch"

    ApplicationSettings.update(%{
      imprint: [
        %{language: "de", text: german_imprint},
        %{language: "en", text: english_imprint}
      ]
    })

    on_exit(fn ->
      ApplicationSettings.update(%{imprint: []})
    end)

    assert {:ok, live_view_pid, html} =
             live(conn, ~p"/imprint")

    assert html =~ @missing_contact_email_warning
    refute html =~ @missing_imprint_warning

    assert html =~ english_imprint
    refute html =~ german_imprint

    html =
      element(live_view_pid, ~s(div[phx-click="select"]), "Deutsch")
      |> render_click()

    refute html =~ english_imprint
    assert html =~ german_imprint

    html =
      element(live_view_pid, ~s(div[phx-click="select"]), "English")
      |> render_click()

    assert html =~ english_imprint
    refute html =~ german_imprint
  end

  test "contact mail setting is displayed", %{conn: conn} do
    example_email = "field_publication@example.org"

    ApplicationSettings.update(%{contact_email: "field_publication@example.org"})

    on_exit(fn ->
      ApplicationSettings.update(%{contact_email: nil})
    end)

    assert {:ok, _live_view_pid, html} =
             live(conn, ~p"/imprint")

    refute html =~ @missing_contact_email_warning
    assert html =~ example_email
    assert html =~ @missing_imprint_warning
  end
end
