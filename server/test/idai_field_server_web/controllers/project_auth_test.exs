defmodule IdaiFieldServerWeb.ProjectAuthTest do
  use IdaiFieldServerWeb.ConnCase, async: true

  alias IdaiFieldServer.Accounts
  alias IdaiFieldServerWeb.ProjectAuth
  import IdaiFieldServer.AccountsFixtures

  setup %{conn: conn} do
    conn =
      conn
      |> Map.replace!(:secret_key_base, IdaiFieldServerWeb.Endpoint.config(:secret_key_base))
      |> init_test_session(%{})

    %{project: project_fixture(), conn: conn}
  end

  describe "log_in_project/3" do
    test "stores the project token in the session", %{conn: conn, project: project} do
      conn = ProjectAuth.log_in_project(conn, project)
      assert token = get_session(conn, :project_token)
      assert get_session(conn, :live_socket_id) == "projects_sessions:#{Base.url_encode64(token)}"
      assert redirected_to(conn) == "/"
      assert Accounts.get_project_by_session_token(token)
    end

    test "clears everything previously stored in the session", %{conn: conn, project: project} do
      conn = conn |> put_session(:to_be_removed, "value") |> ProjectAuth.log_in_project(project)
      refute get_session(conn, :to_be_removed)
    end

    test "redirects to the configured path", %{conn: conn, project: project} do
      conn = conn |> put_session(:project_return_to, "/hello") |> ProjectAuth.log_in_project(project)
      assert redirected_to(conn) == "/hello"
    end

    test "writes a cookie if remember_me is configured", %{conn: conn, project: project} do
      conn = conn |> fetch_cookies() |> ProjectAuth.log_in_project(project, %{"remember_me" => "true"})
      assert get_session(conn, :project_token) == conn.cookies["project_remember_me"]

      assert %{value: signed_token, max_age: max_age} = conn.resp_cookies["project_remember_me"]
      assert signed_token != get_session(conn, :project_token)
      assert max_age == 5_184_000
    end
  end

  describe "logout_project/1" do
    test "erases session and cookies", %{conn: conn, project: project} do
      project_token = Accounts.generate_project_session_token(project)

      conn =
        conn
        |> put_session(:project_token, project_token)
        |> put_req_cookie("project_remember_me", project_token)
        |> fetch_cookies()
        |> ProjectAuth.log_out_project()

      refute get_session(conn, :project_token)
      refute conn.cookies["project_remember_me"]
      assert %{max_age: 0} = conn.resp_cookies["project_remember_me"]
      assert redirected_to(conn) == "/"
      refute Accounts.get_project_by_session_token(project_token)
    end

    test "broadcasts to the given live_socket_id", %{conn: conn} do
      live_socket_id = "projects_sessions:abcdef-token"
      IdaiFieldServerWeb.Endpoint.subscribe(live_socket_id)

      conn
      |> put_session(:live_socket_id, live_socket_id)
      |> ProjectAuth.log_out_project()

      assert_receive %Phoenix.Socket.Broadcast{
        event: "disconnect",
        topic: "projects_sessions:abcdef-token"
      }
    end

    test "works even if project is already logged out", %{conn: conn} do
      conn = conn |> fetch_cookies() |> ProjectAuth.log_out_project()
      refute get_session(conn, :project_token)
      assert %{max_age: 0} = conn.resp_cookies["project_remember_me"]
      assert redirected_to(conn) == "/"
    end
  end

  describe "fetch_current_project/2" do
    test "authenticates project from session", %{conn: conn, project: project} do
      project_token = Accounts.generate_project_session_token(project)
      conn = conn |> put_session(:project_token, project_token) |> ProjectAuth.fetch_current_project([])
      assert conn.assigns.current_project.id == project.id
    end

    test "authenticates project from cookies", %{conn: conn, project: project} do
      logged_in_conn =
        conn |> fetch_cookies() |> ProjectAuth.log_in_project(project, %{"remember_me" => "true"})

      project_token = logged_in_conn.cookies["project_remember_me"]
      %{value: signed_token} = logged_in_conn.resp_cookies["project_remember_me"]

      conn =
        conn
        |> put_req_cookie("project_remember_me", signed_token)
        |> ProjectAuth.fetch_current_project([])

      assert get_session(conn, :project_token) == project_token
      assert conn.assigns.current_project.id == project.id
    end

    test "does not authenticate if data is missing", %{conn: conn, project: project} do
      _ = Accounts.generate_project_session_token(project)
      conn = ProjectAuth.fetch_current_project(conn, [])
      refute get_session(conn, :project_token)
      refute conn.assigns.current_project
    end
  end

  describe "redirect_if_project_is_authenticated/2" do
    test "redirects if project is authenticated", %{conn: conn, project: project} do
      conn = conn |> assign(:current_project, project) |> ProjectAuth.redirect_if_project_is_authenticated([])
      assert conn.halted
      assert redirected_to(conn) == "/"
    end

    test "does not redirect if project is not authenticated", %{conn: conn} do
      conn = ProjectAuth.redirect_if_project_is_authenticated(conn, [])
      refute conn.halted
      refute conn.status
    end
  end

  describe "require_authenticated_project/2" do
    test "redirects if project is not authenticated", %{conn: conn} do
      conn = conn |> fetch_flash() |> ProjectAuth.require_authenticated_project([])
      assert conn.halted
      assert redirected_to(conn) == Routes.project_session_path(conn, :new)
      assert get_flash(conn, :error) == "You must log in to access this page."
    end

    test "stores the path to redirect to on GET", %{conn: conn} do
      halted_conn =
        %{conn | request_path: "/foo?bar"}
        |> fetch_flash()
        |> ProjectAuth.require_authenticated_project([])

      assert halted_conn.halted
      assert get_session(halted_conn, :project_return_to) == "/foo?bar"

      halted_conn =
        %{conn | request_path: "/foo?bar", method: "POST"}
        |> fetch_flash()
        |> ProjectAuth.require_authenticated_project([])

      assert halted_conn.halted
      refute get_session(halted_conn, :project_return_to)
    end

    test "does not redirect if project is authenticated", %{conn: conn, project: project} do
      conn = conn |> assign(:current_project, project) |> ProjectAuth.require_authenticated_project([])
      refute conn.halted
      refute conn.status
    end
  end
end
