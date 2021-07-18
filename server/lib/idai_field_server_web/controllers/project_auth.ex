defmodule IdaiFieldServerWeb.ProjectAuth do
  import Plug.Conn
  import Phoenix.Controller

  alias IdaiFieldServer.Accounts
  alias IdaiFieldServerWeb.Router.Helpers, as: Routes

  # Make the remember me cookie valid for 60 days.
  # If you want bump or reduce this value, also change
  # the token expiry itself in ProjectToken.
  @max_age 60 * 60 * 24 * 60
  @remember_me_cookie "project_remember_me"
  @remember_me_options [sign: true, max_age: @max_age]

  @doc """
  Logs the project in.

  It renews the session ID and clears the whole session
  to avoid fixation attacks. See the renew_session
  function to customize this behaviour.

  It also sets a `:live_socket_id` key in the session,
  so LiveView sessions are identified and automatically
  disconnected on log out. The line can be safely removed
  if you are not using LiveView.
  """
  def log_in_project(conn, project, params \\ %{}) do
    token = Accounts.generate_project_session_token(project)
    project_return_to = get_session(conn, :project_return_to)

    conn
    |> renew_session()
    |> put_session(:project_token, token)
    |> put_session(:live_socket_id, "projects_sessions:#{Base.url_encode64(token)}")
    |> maybe_write_remember_me_cookie(token, params)
    |> redirect(to: project_return_to || signed_in_path(conn))
  end

  defp maybe_write_remember_me_cookie(conn, token, %{"remember_me" => "true"}) do
    put_resp_cookie(conn, @remember_me_cookie, token, @remember_me_options)
  end

  defp maybe_write_remember_me_cookie(conn, _token, _params) do
    conn
  end

  # This function renews the session ID and erases the whole
  # session to avoid fixation attacks. If there is any data
  # in the session you may want to preserve after log in/log out,
  # you must explicitly fetch the session data before clearing
  # and then immediately set it after clearing, for example:
  #
  #     defp renew_session(conn) do
  #       preferred_locale = get_session(conn, :preferred_locale)
  #
  #       conn
  #       |> configure_session(renew: true)
  #       |> clear_session()
  #       |> put_session(:preferred_locale, preferred_locale)
  #     end
  #
  defp renew_session(conn) do
    conn
    |> configure_session(renew: true)
    |> clear_session()
  end

  @doc """
  Logs the project out.

  It clears all session data for safety. See renew_session.
  """
  def log_out_project(conn) do
    project_token = get_session(conn, :project_token)
    project_token && Accounts.delete_session_token(project_token)

    if live_socket_id = get_session(conn, :live_socket_id) do
      IdaiFieldServerWeb.Endpoint.broadcast(live_socket_id, "disconnect", %{})
    end

    conn
    |> renew_session()
    |> delete_resp_cookie(@remember_me_cookie)
    |> redirect(to: "/")
  end

  @doc """
  Authenticates the project by looking into the session
  and remember me token.
  """
  def fetch_current_project(conn, _opts) do
    {project_token, conn} = ensure_project_token(conn)
    project = project_token && Accounts.get_project_by_session_token(project_token)
    assign(conn, :current_project, project)
  end

  defp ensure_project_token(conn) do
    if project_token = get_session(conn, :project_token) do
      {project_token, conn}
    else
      conn = fetch_cookies(conn, signed: [@remember_me_cookie])

      if project_token = conn.cookies[@remember_me_cookie] do
        {project_token, put_session(conn, :project_token, project_token)}
      else
        {nil, conn}
      end
    end
  end

  @doc """
  Used for routes that require the project to not be authenticated.
  """
  def redirect_if_project_is_authenticated(conn, _opts) do
    if conn.assigns[:current_project] do
      conn
      |> redirect(to: signed_in_path(conn))
      |> halt()
    else
      conn
    end
  end

  @doc """
  Used for routes that require the project to be authenticated.

  If you want to enforce the project e-mail is confirmed before
  they use the application at all, here would be a good place.
  """
  def require_authenticated_project(conn, _opts) do
    if conn.assigns[:current_project] do
      conn
    else
      conn
      |> put_flash(:error, "You must log in to access this page.")
      |> maybe_store_return_to()
      |> redirect(to: Routes.project_session_path(conn, :new))
      |> halt()
    end
  end

  defp maybe_store_return_to(%{method: "GET", request_path: request_path} = conn) do
    put_session(conn, :project_return_to, request_path)
  end

  defp maybe_store_return_to(conn), do: conn

  defp signed_in_path(_conn), do: "/"
end
