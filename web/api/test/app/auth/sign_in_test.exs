defmodule Api.AppTest.Auth.SignInTest do
    use ExUnit.Case, async: true
    use Plug.Test

    alias Api.Router

    @api_path "/api"
    @auth_path @api_path <> "/auth"
    @auth_sign_in_path @auth_path <> "/sign_in"

    setup context do
      user = context[:user]
      conn = conn(:post, @auth_sign_in_path, user)
      |> Router.call(Router.init([]))
      result = Poison.decode!(conn.resp_body)
      [result: result]
    end

    @tag user: %{ name: "anonymous" }
    test "anonymous", context do
      assert context.result["is_admin"] == false
    end

    @tag user: %{ name: "user-1", pass: "pass-1" }
    test "known user", context do
      assert context.result["token"] != nil
      assert context.result["info"] == nil
      assert context.result["is_admin"] == false
    end

    @tag user: %{ name: "user-5", pass: "pass-5" }
    test "known admin user", context do
      assert context.result["token"] != nil
      assert context.result["info"] == nil
      assert context.result["is_admin"] == true
    end

    @tag user: %{ name: "user-100", pass: "pass-1" }
    test "unknown user", context do
      assert context.result["token"] == nil
      assert context.result["info"] == "not_found"
      assert context.result["is_admin"] == nil
    end

    @tag user: %{ name: "user-1", pass: "pass-2" }
    test "wrong pass", context do
      assert context.result["token"] == nil
      assert context.result["info"] == "not_found"
      assert context.result["is_admin"] == nil
    end
  end
