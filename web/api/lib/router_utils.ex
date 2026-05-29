defmodule Api.RouterUtils do
  import Plug.Conn,
    only: [put_resp_content_type: 2, send_resp: 3, get_req_header: 2, put_resp_header: 3]

  alias Api.Core.Config
  alias Api.Auth.Rights

  def send_json(conn, content, additional_headers \\ []) do
    conn =
      additional_headers
      |> Enum.reduce(conn, fn {key, val}, acc ->
        put_resp_header(acc, key, val)
      end)
      |> put_resp_content_type("application/json")

    status_code =
      case content do
        %{error: "bad_request"} ->
          400

        %{error: "not_found"} ->
          404

        %{error: "unknown"} ->
          500

        _ ->
          200
      end

    response_body = Poison.encode!(content)

    send_resp(conn, status_code, response_body)
  end

  def send_unauthorized(conn) do
    conn
    |> put_resp_content_type("application/json")
    |> send_resp(401, Poison.encode!(%{error: :unauthorized}))
  end

  def send_error(conn, message) do
    conn
    |> put_resp_content_type("application/json")
    |> send_resp(500, Poison.encode!(%{error: message}))
  end

  def send_not_found(conn) do
    conn
    |> put_resp_content_type("application/json")
    |> send_resp(404, Poison.encode!(%{error: :not_found}))
  end

  def access_for_project_allowed readable_projects, project do

    if project in readable_projects, do: :ok, else: :unauthorized_access
  end

  def get_user conn do
    conn
    |> get_req_header("authorization")
    |> List.first
    |> Rights.authenticate(Config.get(:rights), Config.get(:projects))
  end

  def get_user_from_token token do
    Rights.authenticate(token, Config.get(:rights), Config.get(:projects))
  end

  def cache_header() do
    {
      "cache-control",
      Application.get_env(:api, :cache_control_header, "max-age=0, private, must-revalidate")
    }
  end
end
