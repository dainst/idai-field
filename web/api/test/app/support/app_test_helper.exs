defmodule Api.AppTest.Support.AppTestHelper do

  use Plug.Test
  alias Api.Core.Utils
  alias Api.Router

  @opts Router.init([])

  @api_path "/api"
  @auth_path @api_path <> "/auth"
  @auth_sign_in_path @auth_path <> "/sign_in"

  def api_path, do: @api_path
  def auth_path, do: @auth_path
  def opts, do: @opts

  def perform_query context do
    conn = if :post == context[:method] do
      conn(:post, context[:path], context[:body])
    else
      conn(:get, context[:path])
    end
    conn = Router.call((if login_info = context[:login] do
      {name, pass} = login_info
      token = sign_in(name, pass)
      put_req_header(conn, "authorization", token)
    else
      conn
    end), @opts)
    body = if Enum.member?(conn.resp_headers, {"content-type", "application/json; charset=utf-8"}) do
      Utils.atomize(Poison.decode!(conn.resp_body))
    else
      conn.resp_body
    end
    [conn: conn, body: body]
  end

  def sign_in name, pass do
    conn = conn(:post, @auth_sign_in_path, %{ name: name, pass: pass })
           |> Router.call(@opts)
    Poison.decode!(conn.resp_body)["token"]
  end
end
