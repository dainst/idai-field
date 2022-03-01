defmodule FieldHubWeb.Api.FileControllerTest do
  use FieldHubWeb.ConnCase

  alias FieldHub.{
    TestHelper,
    FileStore
  }

  @project "test_project"
  @user_name "test_user"
  @user_password "test_password"

  describe "couchdb interaction" do

    setup do
      TestHelper.create_test_db_and_user(@project, @user_name, @user_password)

      on_exit(fn ->
        TestHelper.remove_test_db_and_user(@project, @user_name)
      end)
      :ok
    end

    test "GET /files/:project without valid credentials yields 401", %{conn: conn} do

      credentials = Base.encode64("non_existant_user:made_up_password")

      conn =
        conn
        |> put_req_header("authorization", "Basic #{credentials}")
        |> get("/files/test_project")

      assert conn.status == 401
    end

    test "GET /files/:project with valid credentials yields 200", %{conn: conn} do

      credentials = Base.encode64("#{@user_name}:#{@user_password}")

      conn =
        conn
        |> put_req_header("authorization", "Basic #{credentials}")
        |> get("/files/test_project")

      assert conn.status == 200
    end
  end
end
