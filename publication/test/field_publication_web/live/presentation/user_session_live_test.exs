defmodule FieldPublicationWeb.Presentation.UserSessionLiveTest do
  use FieldPublicationWeb.ConnCase

  alias FieldPublicationWeb.UserAuth

  alias FieldPublication.{
    CouchService,
    Projects
  }

  alias FieldPublication.DatabaseSchema.Project

  alias FieldPublication.Test.ProjectSeed

  import Phoenix.LiveViewTest
  @core_database Application.compile_env(:field_publication, :core_database)
  @cache_name Application.compile_env(:field_publication, :user_tokens_cache_name)
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

    %{project: project, publication: publication}
  end

  test "user can log in and out using the interface", %{conn: conn} do
    assert {:ok, live_view_pid, _html} = live(conn, ~p"/")

    assert {:error, {:redirect, %{to: path}}} =
             live_view_pid
             |> element("a", "Log in")
             |> render_click()

    assert {:ok, live_view_pid, html} = live(conn, path)

    assert html =~ "Sign in to account"

    admin_user_name = Application.get_env(:field_publication, :couchdb_admin_name)

    assert logged_in_conn =
             live_view_pid
             |> form("#login_form", %{
               user: %{
                 name: admin_user_name,
                 password: Application.get_env(:field_publication, :couchdb_admin_password)
               }
             })
             |> submit_form(conn)

    # The old `conn` object did not have any credentials, so accessing the management panel throws an error.
    assert {:error,
            {:redirect,
             %{to: "/log_in", flash: %{"error" => "You must log in to access this page."}}}} =
             live(conn, ~p"/management")

    # The new conn object created after submitting has a valid session and thus allows access.
    assert {:ok, live_view_pid, html} = live(logged_in_conn, ~p"/management")

    assert html =~ "<h1>Projects</h1>"

    token =
      logged_in_conn
      |> get_session()
      |> Map.get("user_token")

    assert {:ok, %UserAuth.Token{name: ^admin_user_name}} =
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

  test "wrong credentials get reported back to the login interface", %{conn: conn} do
    assert {:ok, live_view_pid, _html} = live(conn, ~p"/log_in")

    assert error_conn =
             live_view_pid
             |> form("#login_form", %{
               user: %{
                 name: Application.get_env(:field_publication, :couchdb_admin_name),
                 password: "wrong"
               }
             })
             |> submit_form(conn)

    html_response(error_conn, 302) =~ "Invalid name or password"
  end

  test "user can set remember me cookie", %{conn: conn} do
    assert {:ok, live_view_pid, _html} = live(conn, ~p"/log_in")

    assert %Plug.Conn{cookies: cookies} =
             live_view_pid
             |> form("#login_form", %{
               user: %{
                 name: Application.get_env(:field_publication, :couchdb_admin_name),
                 password: Application.get_env(:field_publication, :couchdb_admin_password)
               }
             })
             |> submit_form(conn)

    assert "_field_publication_web_user_remember_me" not in Map.keys(cookies)

    assert {:ok, live_view_pid, _html} = live(conn, ~p"/log_in")

    assert %Plug.Conn{cookies: %{"_field_publication_web_user_remember_me" => _}} =
             live_view_pid
             |> form("#login_form", %{
               user: %{
                 name: Application.get_env(:field_publication, :couchdb_admin_name),
                 password: Application.get_env(:field_publication, :couchdb_admin_password),
                 remember_me: "true"
               }
             })
             |> submit_form(conn)
  end
end
