defmodule Api.Auth.RouterTest do
    use ExUnit.Case, async: true
    use Plug.Test
  
    @auth_info_path Api.AppTestHelper.auth_path <> "/info"
  
    @user5 {"user-5", "pass-5"}
  
    setup context do
      conn = conn(:get, context[:path])
      conn = Api.Router.call((if login_info = context[:login] do
        {name, pass} = login_info
        token = Api.AppTestHelper.sign_in(name, pass)
        put_req_header(conn, "authorization", token)
      else
        conn
      end), Api.AppTestHelper.opts)
      body = if Enum.member?(conn.resp_headers, {"content-type", "application/json; charset=utf-8"}) do
        Api.Core.Utils.atomize(Poison.decode!(conn.resp_body))
      else
        conn.resp_body
      end
      [conn: conn, body: body]
    end
  
    @tag path: @auth_info_path, login: @user5
    test "show readable_projects - anonymous", context do
      assert context.body.readable_projects == ["a", "b"]
    end
  end
  