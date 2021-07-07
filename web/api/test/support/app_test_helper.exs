defmodule Api.AppTestHelper do

  use Plug.Test

  @opts Api.Router.init([])

  @api_path "/api"
  @auth_path @api_path <> "/auth"
  @auth_sign_in_path @auth_path <> "/sign_in"

  def api_path, do: @api_path
  def auth_path, do: @auth_path
  def opts, do: @opts

  def sign_in name, pass do
    conn = conn(:post, @auth_sign_in_path, %{ name: name, pass: pass })
           |> Api.Router.call(@opts)
    Poison.decode!(conn.resp_body)["token"]
  end
end
