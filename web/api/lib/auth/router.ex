defmodule Api.Auth.Router do
  use Plug.Router
  import Api.RouterUtils
  alias Api.Core.Config
  alias Api.Core.Utils
  alias Api.Auth.Rights

  plug :match
  plug :dispatch

  # TODO move somewhere else
  get "/info" do

    bearer = List.first get_req_header(conn, "authorization")
    rights_context = Rights.authenticate(bearer, 
      Config.get(:rights), Config.get(:projects))

    if rights_context.is_admin do
      conn
      |> put_resp_content_type("text/plain")
      |> send_json(%{ readable_projects: rights_context.readable_projects })
    else
      conn
      |> put_resp_content_type("text/plain")
      |> send_unauthorized
    end
  end

  # As body, pass json like this
  # {
  #    "name": "user-1",
  #    "pass": "pass-1"
  # }
  #
  # Issues a token for the user, which can be used in follow up requests
  # to claim to be that same user.
  #
  # IMPL NOTE: The token will only act as an identifier, but in itself will
  #   not contain the user's role (i.e. if he is admin). This is on purpose, so
  #   routers and plugs always have the chance to apply rules with the latest state.
  post "/sign_in" do
    response = Rights.authorize(
      Utils.atomize(conn.body_params), 
      Config.get(:rights))
    conn
    |> put_resp_content_type("text/plain")
    |> send_json(response)
  end
end
