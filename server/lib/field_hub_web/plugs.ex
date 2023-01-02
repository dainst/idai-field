defmodule FieldHubWeb.Plugs do
  import Plug.Conn
  import Phoenix.Controller

  alias FieldHub.CouchService.Credentials
  alias FieldHub.User
  alias FieldHubWeb.Router.Helpers, as: Routes

  # Make the remember me cookie valid for 60 days.
  # If you want bump or reduce this value, also change
  # the token expiry itself in UserToken.
  @max_age 60 * 60 * 24 * 60
  @remember_me_cookie "_fieldhub_web_user_remember_me"
  @remember_me_options [sign: true, max_age: @max_age, same_site: "Lax"]

  # @doc """
  # Generates a token that will be stored in a signed place,
  # such as session or cookie. As they are signed, those
  # tokens do not need to be hashed.

  # The reason why we store session tokens in the database, even
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
  # """
  # def build_session_token(user) do
  #   token = :crypto.strong_rand_bytes(@rand_size)
  #   {token, %UserToken{token: token, context: "session", user_id: user.id}}
  # end

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
  # defp renew_session(conn) do
  #   conn
  #   |> configure_session(renew: true)
  #   |> clear_session()
  # end

  # @doc """
  # Authenticates the user by looking into the session
  # and remember me token.
  # """
  # def fetch_current_user(conn, _opts) do
  #   {user_token, conn} = ensure_user_token(conn)
  #   user = user_token && User.get_user_by_session_token(user_token)
  #   assign(conn, :current_user, user)
  # end

  # defp ensure_user_token(conn) do
  #   if user_token = get_session(conn, :user_token) do
  #     {user_token, conn}
  #   else
  #     conn = fetch_cookies(conn, signed: [@remember_me_cookie])

  #     if user_token = conn.cookies[@remember_me_cookie] do
  #       {user_token, put_session(conn, :user_token, user_token)}
  #     else
  #       {nil, conn}
  #     end
  #   end
  # end

  # @doc """
  # Used for routes that require the user to be authenticated.

  # If you want to enforce the user email is confirmed before
  # they use the application at all, here would be a good place.
  # """
  # def require_authenticated_user(conn, _opts) do
  #   if conn.assigns[:current_user] do
  #     conn
  #     |> IO.inspect()
  #   else
  #     conn
  #     |> maybe_store_return_to()
  #     |> redirect(to: Routes.user_session_path(conn, :new))
  #     |> halt()
  #   end
  # end

  # defp maybe_store_return_to(%{method: "GET"} = conn) do
  #   put_session(conn, :user_return_to, current_path(conn))
  # end

  # defp maybe_store_return_to(conn), do: conn

  # # Fallback path after sign in if no redirect was added.
  # defp signed_in_path(_conn), do: "/"
end
