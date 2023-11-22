defmodule FieldHubWeb.Api.ProjectControllerTest do
  use FieldHubWeb.ConnCase

  alias FieldHub.{
    TestHelper
  }

  @project "test_project"
  @project_user_password "test_project_password"
  @project_user_auth "Basic #{Base.encode64("#{@project}:#{@project_user_password}")}"

  @independent_user_name "test_user"
  @independent_user_password "test_password"
  @independent_user_auth "Basic #{Base.encode64("#{@independent_user_name}:#{@independent_user_password}")}"

  setup_all %{} do
    TestHelper.create_user(@independent_user_name, @independent_user_password)

    on_exit(fn ->
      TestHelper.remove_user(@independent_user_name)
    end)

    :ok
  end

  test "GET /projects for a user without projects returns an empty list", %{conn: conn} do
    conn =
      conn
      |> put_req_header("authorization", @independent_user_auth)
      |> get("/projects")

    assert conn.status == 200

    json_response =
      conn.resp_body
      |> Jason.decode!()

    assert [] == json_response
  end

  test "GET /projects invalid credentials returns 401", %{conn: conn} do
    conn =
      conn
      |> put_req_header("authorization", "Basic #{Base.encode64("unknown:unknown")}")
      |> get("/projects")

    assert conn.status == 401
  end

  test "GET /projects/:project with authenticated user for unknown project returns 404", %{
    conn: conn
  } do
    conn =
      conn
      |> put_req_header("authorization", @independent_user_auth)
      |> get("/projects/#{@project}")

    assert conn.status == 404
  end

  describe "Test project creation: " do
    setup %{} do
      on_exit(fn ->
        TestHelper.remove_test_db_and_user(@project, @project)
      end)
    end

    test "POST /projects/:project returns 412 if default user already exists", %{conn: conn} do
      conn =
        conn
        |> put_req_header("authorization", TestHelper.get_admin_basic_auth())
        |> put_req_header("content-type", "application/json")
        |> post("/projects/#{@independent_user_name}")

      assert conn.status == 412
    end

    test "POST /projects/:project with with valid credentials creates project", %{
      conn: conn
    } do
      conn =
        conn
        |> put_req_header("authorization", TestHelper.get_admin_basic_auth())
        |> post("/projects/#{@project}")

      assert conn.status == 201

      response = Jason.decode!(conn.resp_body)

      assert %{
               "info" => %{
                 "password" => _random,
                 "status_project" => %{
                   "database" => "created",
                   "file_store" => %{"original_image" => "ok", "thumbnail_image" => "ok"}
                 },
                 "status_role" => "set",
                 "status_user" => "created"
               }
             } = response
    end

    test "POST /projects/:project can be invoked with predefined password", %{
      conn: conn
    } do
      conn =
        conn
        |> put_req_header("authorization", TestHelper.get_admin_basic_auth())
        |> put_req_header("content-type", "application/json")
        |> post("/projects/#{@project}", %{password: "password123"})

      assert conn.status == 201

      response = Jason.decode!(conn.resp_body)

      assert %{
               "info" => %{
                 "password" => "password123",
                 "status_project" => %{
                   "database" => "created",
                   "file_store" => %{"original_image" => "ok", "thumbnail_image" => "ok"}
                 },
                 "status_role" => "set",
                 "status_user" => "created"
               }
             } = response
    end

    test "POST /projects/:project with invalid project name returns :bad_request", %{
      conn: conn
    } do
      conn =
        conn
        |> put_req_header("authorization", TestHelper.get_admin_basic_auth())
        |> post("/projects/Проект")

      assert conn.status == 400

      response = Jason.decode!(conn.resp_body)

      assert %{
               "reason" => "Invalid project name: Identifier can have 30 characters maximum and requires valid name, regex: /^[a-z][a-z0-9_$()+/-]*$/"
             } = response
    end

    test "POST /projects/:project with project identifier longer that 30 characters returns :bad_request", %{
      conn: conn
    } do
      conn =
        conn
        |> put_req_header("authorization", TestHelper.get_admin_basic_auth())
        |> post("/projects/asdfasdfasdfasdfasdfdfasdfasdfasfdasfdasdf")

      assert conn.status == 400

      response = Jason.decode!(conn.resp_body)

      assert %{
               "reason" => "Invalid project name: Identifier can have 30 characters maximum and requires valid name, regex: /^[a-z][a-z0-9_$()+/-]*$/"
             } = response
    end
  end

  describe "Test existing projects: " do
    setup %{} do
      TestHelper.create_test_db_and_user(@project, @project, @project_user_password)

      on_exit(fn ->
        TestHelper.remove_test_db_and_user(@project, @project)
      end)

      :ok
    end

    test "GET /projects returns a list of all projects the user has access to", %{conn: conn} do
      conn =
        conn
        |> put_req_header("authorization", @project_user_auth)
        |> get("/projects")

      assert conn.status == 200

      json_response =
        conn.resp_body
        |> Jason.decode!()

      assert ["#{@project}"] == json_response
    end

    test "GET /projects/:project valid credentials returns basic statistics", %{conn: conn} do
      conn =
        conn
        |> put_req_header("authorization", @project_user_auth)
        |> get("/projects/#{@project}")

      assert conn.status == 200

      response = Jason.decode!(conn.resp_body)

      assert %{
               "database" => %{"doc_count" => 0, "file_size" => _},
               "files" => %{
                 "original_image" => %{
                   "active" => 0,
                   "active_size" => 0,
                   "deleted" => 0,
                   "deleted_size" => 0
                 },
                 "thumbnail_image" => %{
                   "active" => 0,
                   "active_size" => 0,
                   "deleted" => 0,
                   "deleted_size" => 0
                 }
               },
               "name" => @project
             } = response
    end

    test "GET /projects/:project with unknown project returns :not_found", %{conn: conn} do
      conn =
        conn
        |> put_req_header("authorization", @project_user_auth)
        |> get("/projects/does-not-exist")

      assert conn.status == 404
    end

    test "GET /projects/:project invalid credentials returns 401", %{conn: conn} do
      conn =
        conn
        |> put_req_header("authorization", "Basic #{Base.encode64("unknown:unknown")}")
        |> get("/projects/#{@project}")

      assert conn.status == 401
    end

    test "POST /projects/:project on existing project returns matching response", %{conn: conn} do
      conn =
        conn
        |> put_req_header("authorization", TestHelper.get_admin_basic_auth())
        |> put_req_header("content-type", "application/json")
        |> post("/projects/#{@project}")

      assert conn.status == 412
    end

    test "POST /projects/:project is forbidden for normal users", %{conn: conn} do
      conn =
        conn
        |> put_req_header("authorization", @independent_user_auth)
        |> put_req_header("content-type", "application/json")
        |> post("/projects/#{@project}")

      assert conn.status == 403
    end

    test "POST /projects/:project is forbidden without authentication", %{conn: conn} do
      conn =
        conn
        |> put_req_header("content-type", "application/json")
        |> post("/projects/#{@project}")

      assert conn.status == 401
    end

    test "DELETE /projects/:project deletes existing project", %{conn: conn} do
      conn =
        conn
        |> put_req_header("authorization", TestHelper.get_admin_basic_auth())
        |> delete("/projects/#{@project}")

      assert conn.status == 200

      response = Jason.decode!(conn.resp_body)

      assert %{
               "info" => %{
                 "status_project" => %{"database" => "deleted", "file_store" => []},
                 "status_user" => "deleted"
               }
             } = response
    end

    test "DELETE /projects/:project is forbidden for normal users", %{conn: conn} do
      conn =
        conn
        |> put_req_header("authorization", @project_user_auth)
        |> delete("/projects/#{@project}")

      assert conn.status == 403
    end

    test "DELETE /projects/:project forbidden without authentication", %{conn: conn} do
      conn =
        conn
        |> delete("/projects/#{@project}")

      assert conn.status == 401
    end
  end
end
