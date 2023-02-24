defmodule FieldHubWeb.UserAuth do
  import Plug.Conn
  import Phoenix.Controller

  alias FieldHub.{
    CouchService,
    CouchService.Credentials,
    Project,
    User
  }

  alias FieldHubWeb.Router.Helpers, as: Routes

  defmodule Token do
    @enforce_keys [:name, :token, :context]
    defstruct [:name, :token, :context]
  end

  @cache_name Application.compile_env(:field_hub, :user_tokens_cache_name)
  @cache_expiration_ms 1000 * 60 * 60 * 24 * 7

  @doc """
  Generates a session token.
  """
  def generate_user_session_token(user) do
    token = :crypto.strong_rand_bytes(32)
    cached_data = %Token{token: token, context: "session", name: user}

    Cachex.put!(@cache_name, token, cached_data, ttl: @cache_expiration_ms)
    token
  end

  @doc """
  Gets the user with the given signed token.
  """
  def get_user_by_session_token(token) do
    case Cachex.get(@cache_name, token) do
      {:ok, %Token{name: name}} ->
        name

      _ ->
        nil
    end
  end

  @doc """
  Deletes the signed token with the given context.
  """
  def delete_session_token(token) do
    Cachex.del(@cache_name, token)
    :ok
  end

  @doc """
  Validates `conn` with basic access authentication for the project provided in `conn.params`.
  """
  def api_require_user_authentication(conn, _opts) do
    case Plug.BasicAuth.parse_basic_auth(conn) do
      {name, password} ->
        case CouchService.authenticate(%Credentials{name: name, password: password}) do
          :ok ->
            conn
            |> assign(:current_user, name)

          {:error, 401} ->
            conn
            |> Plug.BasicAuth.request_basic_auth()
            |> send_resp()
            |> halt()
        end

      _ ->
        conn
        |> Plug.BasicAuth.request_basic_auth()
        |> send_resp()
        |> halt()
    end
  end

  @doc """
  Validates `conn` with basic access authentication for the project provided in `conn.params`.
  """
  def api_require_project_authorization(
        %{params: %{"project" => project_identifier}} = conn,
        _opts
      ) do
    case conn do
      %{assigns: %{current_user: user_name}} ->
        case Project.check_project_authorization(project_identifier, user_name) do
          :granted ->
            conn

          :denied ->
            conn
            |> send_resp(403, "")
            |> halt()

          :unknown_project ->
            conn
            |> send_resp(404, "Unknown project #{project_identifier}.")
            |> halt()
        end

      _ ->
        conn
        |> Plug.BasicAuth.request_basic_auth()
        |> send_resp()
        |> halt()
    end
  end

  def api_require_admin(conn, _opts) do
    case Plug.BasicAuth.parse_basic_auth(conn) do
      {name, password} ->
        admin_name = Application.get_env(:field_hub, :couchdb_admin_name)
        admin_password = Application.get_env(:field_hub, :couchdb_admin_password)

        if name == admin_name and password == admin_password do
          conn
          |> fetch_session()
          |> assign(:current_user, name)
        else
          conn
          |> send_resp(403, "")
          |> halt()
        end

      _ ->
        conn
        |> Plug.BasicAuth.request_basic_auth()
        |> send_resp()
        |> halt()
    end
  end

  @doc """
  Logs the user in.

  It renews the session ID and clears the whole session
  to avoid fixation attacks. See the renew_session
  function to customize this behaviour.

  It also sets a `:live_socket_id` key in the session,
  so LiveView sessions are identified and automatically
  disconnected on log out. The line can be safely removed
  if you are not using LiveView.
  """
  def log_in_user(conn, user, _params \\ %{}) do
    token = generate_user_session_token(user)
    user_return_to = get_session(conn, :user_return_to)

    conn
    |> renew_session()
    |> put_session(:user_token, token)
    |> put_session(:live_socket_id, "users_sessions:#{Base.url_encode64(token)}")
    |> redirect(to: user_return_to || signed_in_path(conn))
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
  Logs the user out.

  It clears all session data for safety. See renew_session.
  """
  def log_out_user(conn) do
    user_token = get_session(conn, :user_token)
    user_token && delete_session_token(user_token)

    if live_socket_id = get_session(conn, :live_socket_id) do
      FieldHubWeb.Endpoint.broadcast(live_socket_id, "disconnect", %{})
    end

    conn
    |> renew_session()
    |> redirect(to: "/")
  end

  @doc """
  Authenticates the user by looking into the session
  and remember me token.
  """
  def fetch_current_user(conn, _opts) do
    {user_token, conn} = ensure_user_token(conn)
    user = user_token && get_user_by_session_token(user_token)
    assign(conn, :current_user, user)
  end

  defp ensure_user_token(conn) do
    if user_token = get_session(conn, :user_token) do
      {user_token, conn}
    else
      {nil, conn}
    end
  end

  @doc """
  Used for routes that require the user to be authenticated.
  """
  def ui_require_user_authentication(conn, _opts) do
    if conn.assigns[:current_user] do
      conn
    else
      conn
      |> put_flash(:error, "You must log in to access this page.")
      |> maybe_store_return_to()
      |> redirect(to: Routes.user_session_path(conn, :new))
      |> halt()
    end
  end

  @doc """
  Used for routes that require the user to be authorized for a specified project.
  """
  def ui_require_project_authorization(
        %{params: %{"project" => project_identifier}} = conn,
        _opts
      ) do
    case conn do
      %{assigns: %{current_user: current_user}} ->
        Project.check_project_authorization(project_identifier, current_user)

      _ ->
        :denied
    end
    |> case do
      :granted ->
        conn

      :denied ->
        conn
        |> put_flash(:error, "You are not authorized for project '#{project_identifier}'.")
        |> redirect(to: "/")
        |> halt()

      :unknown_project ->
        conn
        |> put_flash(:error, "Unknown project '#{project_identifier}'.")
        |> redirect(to: "/")
        |> halt()
    end
  end

  def ui_require_admin(%{assigns: %{current_user: current_user}} = conn, _) do
    case User.is_admin?(current_user) do
      true ->
        conn

      _ ->
        conn
        |> put_flash(:error, "You are not authorized to view this page.")
        |> redirect(to: "/")
        |> halt()
    end
  end

  defp maybe_store_return_to(%{method: "GET"} = conn) do
    put_session(conn, :user_return_to, current_path(conn))
  end

  defp maybe_store_return_to(conn), do: conn

  defp signed_in_path(_conn), do: "/"
end
