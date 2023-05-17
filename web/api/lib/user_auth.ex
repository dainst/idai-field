defmodule Api.UserAuth do
  import Plug.Conn

  alias Api.User

  @doc """
  Validates `conn` with basic access authentication for the project provided in `conn.params`.
  """
  def api_require_user_authentication(conn, _opts) do

    case Plug.BasicAuth.parse_basic_auth(conn) do
      {name, password} ->
        case User.authenticate(name, password) do
          :success ->
            conn
            |> assign(:current_user, name)

          :denied ->
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
end
