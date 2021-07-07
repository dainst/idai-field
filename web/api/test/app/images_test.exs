defmodule Api.ImagesTest do
  use ExUnit.Case, async: true
  use Plug.Test

  @api_path Api.AppTestHelper.api_path
  @image_path @api_path <> "/images"

  @user1 {"user-1", "pass-1"}
  @user2 {"user-2", "pass-2"}

  setup context do
    token = if login_info = context[:login] do
      {name, pass} = login_info
      Api.AppTestHelper.sign_in(name, pass)
    else
      "anonymous"
    end

    path = String.replace(context[:path], "TOKEN", token)
    conn = conn(:get, path) |> Api.Router.call(Api.AppTestHelper.opts)

    body = if Enum.member?(conn.resp_headers, {"content-type", "application/json; charset=utf-8"}) do
      Api.Core.Utils.atomize(Poison.decode!(conn.resp_body))
    else
      conn.resp_body
    end
    [conn: conn, body: body]
  end

  @tag path: @image_path <> "/a/doc-of-proj-a/TOKEN/default.json"
  test "get image", context do
    assert context.conn.state == :sent
    assert context.conn.status == 200
  end

  @tag path: @image_path <> "/b/doc-of-proj-b/TOKEN/default.json"
  test "image not authorized", context do
    assert context.conn.state == :sent
    assert context.conn.status == 401
    assert context.body.error == "unauthorized"
  end

  @tag path: @image_path <> "/b/doc-of-proj-b/TOKEN/default.json", login: @user1
  test "image authorized", context do
    assert context.conn.state == :sent
    assert context.conn.status == 200
  end

  @tag path: @image_path <> "/c/non-existing-doc/TOKEN/default.json", login: @user2
  test "image not found", context do
    assert context.conn.state == :file
    assert context.conn.status == 200
  end
end
