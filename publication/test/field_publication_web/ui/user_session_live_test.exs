defmodule FieldPublicationWeb.UI.UserSessionLiveTest do
  use FieldPublicationWeb.ConnCase

  import Phoenix.LiveViewTest
  import FieldPublication.Test.DataScaffolding

  alias FieldPublicationWeb.UserAuth

  alias FieldPublication.User

  @cache_name Application.compile_env(:field_publication, :user_tokens_cache_name)

  setup_all [
    :create_core_database,
    :add_editor_user,
    :add_admin_user
  ]

  test "user can log in and out using the interface", %{
    conn: conn,
    editor: %User{name: user_name, password: password}
  } do
    assert {:ok, live_view_pid, _html} = live(conn, ~p"/")

    assert {:error, {:redirect, %{to: path}}} =
             live_view_pid
             |> element("a", "Log in")
             |> render_click()

    assert {:ok, live_view_pid, html} = live(conn, path)

    assert html =~ "Sign in to account"

    assert logged_in_conn =
             live_view_pid
             |> form("#login_form", %{
               user: %{
                 name: user_name,
                 password: password
               }
             })
             |> submit_form(conn)

    # The old `conn` object did not have any credentials, so accessing the management panel throws an error.
    assert {:error,
            {:redirect,
             %{to: "/log_in", flash: %{"error" => "You must log in to access this page."}}}} =
             live(conn, ~p"/management")

    # The new conn object created after submitting has a valid session and thus allows access.
    assert {:ok, live_view_pid, _html} = live(logged_in_conn, ~p"/management")

    token =
      logged_in_conn
      |> get_session()
      |> Map.get("user_token")

    assert {:ok, %UserAuth.Token{name: ^user_name}} =
             Cachex.get(@cache_name, token)

    assert {:error, {:redirect, %{to: path}}} =
             live_view_pid
             |> element("a", "Log out")
             |> render_click()

    logged_out_conn = delete(logged_in_conn, path)

    assert {:ok, nil} = Cachex.get(@cache_name, token)

    assert {:error,
            {:redirect,
             %{to: "/log_in", flash: %{"error" => "You must log in to access this page."}}}} =
             live(logged_out_conn, ~p"/management")
  end

  test "wrong credentials get reported back to the login interface", %{
    conn: conn,
    editor: %User{name: user_name}
  } do
    assert {:ok, live_view_pid, _html} = live(conn, ~p"/log_in")

    assert error_conn =
             live_view_pid
             |> form("#login_form", %{
               user: %{
                 name: user_name,
                 password: "wrong"
               }
             })
             |> submit_form(conn)

    html_response(error_conn, 302) =~ "Invalid name or password"
  end

  test "user can set remember me cookie", %{
    conn: conn,
    editor: %User{name: user_name, password: password}
  } do
    assert {:ok, live_view_pid, _html} = live(conn, ~p"/log_in")

    assert %Plug.Conn{cookies: cookies} =
             live_view_pid
             |> form("#login_form", %{
               user: %{
                 name: user_name,
                 password: password
               }
             })
             |> submit_form(conn)

    assert "_field_publication_web_user_remember_me" not in Map.keys(cookies)

    assert {:ok, live_view_pid, _html} = live(conn, ~p"/log_in")

    assert %Plug.Conn{cookies: %{"_field_publication_web_user_remember_me" => _}} =
             live_view_pid
             |> form("#login_form", %{
               user: %{
                 name: user_name,
                 password: password,
                 remember_me: "true"
               }
             })
             |> submit_form(conn)
  end
end
