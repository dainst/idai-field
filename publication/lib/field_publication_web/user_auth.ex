defmodule FieldPublicationWeb.UserAuth do
  alias FieldPublication.{
    Publications,
    Projects
  }

  use FieldPublicationWeb, :verified_routes

  import Plug.Conn
  import Phoenix.Controller

  defmodule Token do
    @enforce_keys [:name, :token, :context]
    defstruct [:name, :token, :context]
  end

  # Make the remember me cookie valid for 7 days.
  # If you want bump or reduce this value, also change
  # the token expiry itself in UserToken.
  @max_age 60 * 60 * 24 * 7
  @remember_me_cookie "_field_publication_web_user_remember_me"
  @remember_me_options [sign: true, max_age: @max_age, same_site: "Lax"]
  @cache_name Application.compile_env(:field_publication, :user_tokens_cache_name)

  @doc """
  Logs the user in.

  It renews the session ID and clears the whole session
  to avoid fixation attacks. See the renew_session
  function to customize this behaviour.

  It also sets a `:live_socket_id` key in the session,
  so LiveView sessions are identified and automatically
  disconnected on log out.
  """
  def log_in_user(conn, user_name, params) do
    token = generate_user_session_token(user_name)
    user_return_to = get_session(conn, :user_return_to)

    conn
    |> renew_session()
    |> put_token_in_session(token)
    |> maybe_write_remember_me_cookie(token, params)
    |> redirect(to: user_return_to || signed_in_path(conn))
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
  Logs the user out.

  It clears all session data for safety. See renew_session.
  """
  def log_out_user(conn) do
    user_token = get_session(conn, :user_token)
    user_token && delete_session_token(user_token)

    if live_socket_id = get_session(conn, :live_socket_id) do
      FieldPublicationWeb.Endpoint.broadcast(live_socket_id, "disconnect", %{})
    end

    conn
    |> renew_session()
    |> delete_resp_cookie(@remember_me_cookie)
    |> redirect(to: ~p"/")
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
    if token = get_session(conn, :user_token) do
      {token, conn}
    else
      conn = fetch_cookies(conn, signed: [@remember_me_cookie])

      if token = conn.cookies[@remember_me_cookie] do
        {token, put_token_in_session(conn, token)}
      else
        {nil, conn}
      end
    end
  end

  @doc """
  Handles mounting and authenticating the current_user in LiveViews.

  ## `on_mount` arguments

    * `:mount_current_user` - Assigns current_user
      to socket assigns based on user_token, or nil if
      there's no user_token or no matching user.

    * `:ensure_authenticated` - Authenticates the user from the session,
      and assigns the current_user to socket assigns based
      on user_token.
      Redirects to login page if there's no logged user.

    * `:redirect_if_user_is_authenticated` - Authenticates the user from the session.
      Redirects to signed_in_path if there's a logged user.

  ## Examples

  Use the `on_mount` lifecycle macro in LiveViews to mount or authenticate
  the current_user:

      defmodule FieldPublicationWeb.PageLive do
        use FieldPublicationWeb, :live_view

        on_mount {FieldPublicationWeb.UserAuth, :mount_current_user}
        ...
      end

  Or use the `live_session` of your router to invoke the on_mount callback:

      live_session :valid, on_mount: [{FieldPublicationWeb.UserAuth, :ensure_authenticated}] do
        live "/profile", ProfileLive, :index
      end
  """
  def on_mount(:mount_current_user, _params, session, socket) do
    {:cont, mount_current_user(socket, session)}
  end

  def on_mount(:ensure_authenticated, _params, session, socket) do
    socket = mount_current_user(socket, session)

    if socket.assigns.current_user do
      {:cont, socket}
    else
      socket =
        socket
        |> Phoenix.LiveView.put_flash(:error, "You must log in to access this page.")
        |> Phoenix.LiveView.redirect(to: ~p"/log_in")

      {:halt, socket}
    end
  end

  def on_mount(:ensure_has_project_access, %{"project_id" => project_name}, session, socket) do
    socket = mount_current_user(socket, session)

    if Projects.has_project_access?(
         project_name,
         socket.assigns.current_user
       ) do
      {:cont, socket}
    else
      socket =
        socket
        |> Phoenix.LiveView.put_flash(:error, "You are not allowed to access that page.")
        |> Phoenix.LiveView.redirect(to: ~p"/")

      {:halt, socket}
    end
  end

  def on_mount(
        :ensure_project_published_or_project_access,
        %{"project_id" => project_name, "draft_date" => draft_date} = _opts,
        session,
        socket
      ) do
    socket = mount_current_user(socket, session)

    Publications.get(project_name, draft_date)
    |> case do
      {:error, :not_found} ->
        {
          :halt,
          socket
          |> Phoenix.LiveView.put_flash(:error, "Unknown publication.")
          |> Phoenix.LiveView.redirect(to: ~p"/")
        }

      {:ok, %FieldPublication.DatabaseSchema.Publication{} = publication} ->
        if not Projects.has_publication_access?(publication, socket.assigns.current_user) do
          {
            :halt,
            socket
            |> Phoenix.LiveView.put_flash(:error, "You are not allowed to access that page.")
            |> Phoenix.LiveView.redirect(to: ~p"/")
          }
        else
          {:cont, socket}
        end
    end
  end

  def on_mount(
        :ensure_project_published_or_project_access,
        %{"project_id" => project_name},
        session,
        socket
      ) do
    socket = mount_current_user(socket, session)

    Publications.get_most_recent(project_name, socket.assigns.current_user)
    |> case do
      nil ->
        {
          :halt,
          socket
          |> Phoenix.LiveView.put_flash(:error, "Project has no publication.")
          |> Phoenix.LiveView.redirect(to: ~p"/")
        }

      %FieldPublication.DatabaseSchema.Publication{} = _most_recent ->
        {:cont, socket}
    end
  end

  def on_mount(:ensure_is_admin, _params, session, socket) do
    socket = mount_current_user(socket, session)

    if FieldPublication.Users.is_admin?(socket.assigns.current_user) do
      {:cont, socket}
    else
      socket =
        socket
        |> Phoenix.LiveView.put_flash(:error, "You are not allowed to access that page.")
        |> Phoenix.LiveView.redirect(to: ~p"/")

      {:halt, socket}
    end
  end

  def on_mount(:redirect_if_user_is_authenticated, _params, session, socket) do
    socket = mount_current_user(socket, session)

    if socket.assigns.current_user do
      {:halt, Phoenix.LiveView.redirect(socket, to: signed_in_path(socket))}
    else
      {:cont, socket}
    end
  end

  defp mount_current_user(socket, session) do
    Phoenix.Component.assign_new(socket, :current_user, fn ->
      if user_token = session["user_token"] do
        get_user_by_session_token(user_token)
      end
    end)
  end

  @doc """
  Used for routes that require the user to not be authenticated.
  """
  def redirect_if_user_is_authenticated(conn, _opts) do
    if conn.assigns[:current_user] do
      conn
      |> redirect(to: signed_in_path(conn))
      |> halt()
    else
      conn
    end
  end

  @doc """
  Used for routes that require the user to be authenticated.
  """
  def require_authenticated_user(conn, _opts) do
    if conn.assigns[:current_user] do
      conn
    else
      conn
      |> put_flash(:error, "You must log in to access this page.")
      |> maybe_store_return_to()
      |> redirect(to: ~p"/log_in")
      |> halt()
    end
  end

  @doc """
  Used for routes that require the user to be authenticated.
  """
  def require_project_access(%{params: %{"project_id" => project_id}} = conn, _opts) do
    if Projects.has_project_access?(
         project_id,
         conn.assigns[:current_user]
       ) do
      conn
    else
      conn
      |> put_flash(:error, "You are not allowed to access that page.")
      |> redirect(to: ~p"/")
      |> halt()
    end
  end

  def require_published_or_project_access(
        %{params: %{"project_id" => project_id, "draft_date" => draft_date}} = conn,
        _options
      ) do
    Publications.get(project_id, draft_date)
    |> case do
      {:error, :not_found} ->
        conn
        |> resp(
          404,
          "No publication found for project '#{project_id}' with a publication date of '#{draft_date}'."
        )
        |> halt()

      {:ok, %FieldPublication.DatabaseSchema.Publication{} = publication} ->
        if not Projects.has_publication_access?(publication, conn.assigns.current_user) do
          conn
          |> resp(403, "You are not allowed to access that page.")
          |> halt()
        else
          conn
        end
    end
  end

  def require_published_or_project_access(
        %{params: %{"project_id" => project_id}} = conn,
        _opts
      ) do
    Publications.get_most_recent(project_id, conn.assigns.current_user)
    |> case do
      nil ->
        conn
        |> resp(404, "No publications found for project '#{project_id}'.")
        |> halt()

      %FieldPublication.DatabaseSchema.Publication{} = _most_recent ->
        conn
    end
  end

  @doc """
  Used for routes exclusive to the CouchDB admin.
  """
  def require_administrator(conn, _opts) do
    if FieldPublication.Users.is_admin?(conn.assigns[:current_user]) do
      conn
    else
      conn
      |> put_flash(:error, "You are not allowed to access that page.")
      |> redirect(to: ~p"/")
      |> halt()
    end
  end

  def ensure_image_published(
        %{params: %{"project_name" => project_name, "uuid" => uuid}} = conn,
        _options
      ) do
    check_image_access(conn, project_name, uuid)
  end

  def ensure_image_published(
        %{
          path_info: ["api", "image", "iiif", "3", image_name | _everything_afterwards]
        } =
          conn,
        _opts
      ) do
    # This is the variant of ensure_image_published/2 that is used for the reverse proxy routes of the
    # cantaloupe image server. We can not extract project_name and uuid beforehand.
    [project_name, uuid] =
      image_name
      |> String.replace_suffix(".jp2", "")
      |> String.split("%2F")

    check_image_access(conn, project_name, uuid)
  end

  defp check_image_access(conn, project_name, uuid) do
    case Cachex.get(:published_images, {project_name, uuid}) do
      {:ok, true} ->
        # The image was evaluated as published before, image access is granted.
        conn

      {:ok, false} ->
        if Projects.has_project_access?(project_name, conn.assigns[:current_user]) do
          # The image is part of a non published draft the user has access to, image access is granted.
          conn
        else
          # Neither published nor user access.
          conn
          |> resp(403, "The image you requested has not been published.")
          |> halt()
        end

      _ ->
        # The image has not been evaluated since the start of the application (not found in cache).
        if is_image_published?(project_name, uuid) do
          # Mark the image as published for all further requests, image access is granted.
          Cachex.put(:published_images, {project_name, uuid}, true)
          conn
        else
          # Put `false` as cache value, but with a time to live (ttl) of 60 minutes.
          Cachex.put(:published_images, {project_name, uuid}, false, ttl: 1000 * 60 * 60)

          if Projects.has_project_access?(project_name, conn.assigns[:current_user]) do
            # The image is part of a non published draft the user has access to, image access is granted.
            conn
          else
            # Neither published nor user access.
            conn
            |> resp(403, "The image you requested has not been published.")
            |> halt()
          end
        end
    end
  end

  defp is_image_published?(project_name, uuid) do
    publication =
      Publications.get_published(project_name)
      |> Enum.find(fn pub ->
        Publications.Data.document_exists?(uuid, pub)
      end)

    case publication do
      nil ->
        false

      _ ->
        true
    end
  end

  def forward_headers(conn, _options) do
    # TODO: This might break if we change the runtime.exs or dev.exs/test.exs
    FieldPublicationWeb.Endpoint.config(:url)
    |> Keyword.get(:port)
    |> case do
      nil ->
        # Development/test case
        Plug.Conn.put_req_header(conn, "x-forwarded-port", "4001")

      _ ->
        # Release case
        conn
    end
    |> Plug.Conn.put_req_header("x-forwarded-path", "/api/image/")
  end

  def put_token_in_session(conn, token) do
    conn
    |> put_session(:user_token, token)
    |> put_session(:live_socket_id, "users_sessions:#{Base.url_encode64(token)}")
  end

  defp maybe_store_return_to(%{method: "GET"} = conn) do
    put_session(conn, :user_return_to, current_path(conn))
  end

  defp maybe_store_return_to(conn), do: conn

  defp signed_in_path(_conn), do: ~p"/"

  def generate_user_session_token(user) do
    # Generates a token that will be stored in a signed place,
    # such as session or cookie. As they are signed, those
    # tokens do not need to be hashed.

    # The reason why we store session tokens in the cache, even
    # though Phoenix already provides a session cookie, is because
    # Phoenix' default session cookies are not persisted, they are
    # simply signed and potentially encrypted. This means they are
    # valid indefinitely, unless you change the signing/encryption
    # salt.

    # Therefore, storing them allows individual user
    # sessions to be expired. The token system can also be extended
    # to store additional data, such as the device used for logging in.
    # You could then use this information to display all valid sessions
    # and devices in the UI and allow users to explicitly expire any
    # session they deem invalid.

    # This implementation is a modified version of the `mix phx.gen.auth`
    # result, the main difference beeing that we do not store the token in
    # our database, but in a `Cachex` cache. For our case this seemed simpler
    # because we do not expect many user accounts, so holding (and expiring)
    # tokens in memory instead of doing a database roundtrip should not be a problem.
    token = :crypto.strong_rand_bytes(32)
    cached_data = %Token{token: token, context: "session", name: user}

    Cachex.put!(@cache_name, token, cached_data, ttl: 1000 * @max_age)
    token
  end

  defp get_user_by_session_token(token) do
    # Gets the user with the given signed token.
    case Cachex.get(@cache_name, token) do
      {:ok, %Token{name: name}} ->
        name

      _ ->
        nil
    end
  end

  defp delete_session_token(token) do
    # Deletes the signed token with the given context.
    Cachex.del(@cache_name, token)
    :ok
  end
end
