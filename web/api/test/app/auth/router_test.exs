defmodule Api.AppTest.Auth.RouterTest do
    use ExUnit.Case, async: true
    use Plug.Test
    alias Api.AppTest.Support.AppTestHelper

    @auth_info_path AppTestHelper.auth_path <> "/info"

    @user5 {"user-5", "pass-5"}

    setup context do
      AppTestHelper.perform_query context
    end

    @tag path: @auth_info_path, login: @user5
    test "show readable_projects - anonymous", context do
      assert context.body.readable_projects == ["a", "b"]
    end
  end
