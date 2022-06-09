defmodule FieldHubWeb.Api.FileControllerTest do
  use FieldHubWeb.ConnCase

  alias FieldHub.TestHelper

  @file_directory_root Application.get_env(:field_hub, :file_directory_root)

  @project "test_project"
  @user_name "test_user"
  @user_password "test_password"
  @exampleFile File.read!("test/fixtures/logo.png")
  @schema File.read!("../core/api-schemas/files-list.json")
    |> Jason.decode!()
    |> ExJsonSchema.Schema.resolve()

  setup do
    # Run before each test
    TestHelper.create_test_db_and_user(@project, @user_name, @user_password)

    on_exit(fn ->
      # Run after each test
      TestHelper.remove_test_db_and_user(@project, @user_name)
      File.rm_rf!(@file_directory_root)
    end)
    :ok
  end

  test "PUT /files/:project/:uuid creates file with specified uuid and type", %{conn: conn} do
    credentials = Base.encode64("#{@user_name}:#{@user_password}")

    conn =
      conn
      |> put_req_header("authorization", "Basic #{credentials}")
      |> put_req_header("content-type", "image/png")
      |> put("/files/test_project/1234?type=original_image", @exampleFile)

    assert conn.status == 201

    conn =
      conn
      |> recycle()
      |> put_req_header("authorization", "Basic #{credentials}")
      |> get("/files/test_project/1234?type=original_image")

    assert conn.resp_body == @exampleFile
  end

  test "GET /files/:project without valid credentials yields 401", %{conn: conn} do

    credentials = Base.encode64("non_existant_user:made_up_password")

    conn =
      conn
      |> put_req_header("authorization", "Basic #{credentials}")
      |> get("/files/test_project")

    assert conn.status == 401
  end

  test "GET /files/:project without images yields valid json", %{conn: conn} do

    credentials = Base.encode64("#{@user_name}:#{@user_password}")

    conn =
      conn
      |> put_req_header("authorization", "Basic #{credentials}")
      |> get("/files/test_project")

    assert conn.status == 200

    json_response =
      conn.resp_body
      |> Jason.decode!()

    assert json_response == %{}
    assert ExJsonSchema.Validator.valid?(@schema, json_response)
  end

  test "GET /files/:project with image yields valid json", %{conn: conn} do

    credentials = Base.encode64("#{@user_name}:#{@user_password}")

    conn =
      conn
      |> put_req_header("authorization", "Basic #{credentials}")
      |> put_req_header("content-type", "image/png")
      |> put("/files/test_project/1234?type=original_image", @exampleFile)

    assert conn.status == 201

    conn =
      conn
      |> recycle()
      |> put_req_header("authorization", "Basic #{credentials}")
      |> get("/files/test_project")

    json_response =
      conn.resp_body
      |> Jason.decode!()

    assert %{"1234" => %{"deleted" => false, "types" => ["original_image"]}} = json_response
    assert ExJsonSchema.Validator.valid?(@schema, json_response)
  end

  test "GET /files/:project different file variants get added to the response", %{conn: conn} do

    credentials = Base.encode64("#{@user_name}:#{@user_password}")

    conn =
      conn
      |> put_req_header("authorization", "Basic #{credentials}")
      |> put_req_header("content-type", "image/png")
      |> put("/files/test_project/1234?type=original_image", @exampleFile)

    assert conn.status == 201

    conn =
      conn
      |> recycle()
      |> put_req_header("authorization", "Basic #{credentials}")
      |> get("/files/test_project")

    json_response =
      conn.resp_body
      |> Jason.decode!()

    assert %{"1234" => %{"deleted" => false, "types" => ["original_image"]}} = json_response
    assert ExJsonSchema.Validator.valid?(@schema, json_response)

    conn =
      conn
      |> recycle()
      |> put_req_header("authorization", "Basic #{credentials}")
      |> put_req_header("content-type", "image/png")
      |> put("/files/test_project/1234?type=thumbnail_image", @exampleFile)

    assert conn.status == 201

    conn =
      conn
      |> recycle()
      |> put_req_header("authorization", "Basic #{credentials}")
      |> get("/files/test_project")

    json_response =
      conn.resp_body
      |> Jason.decode!()

    assert %{"1234" => %{"deleted" => false, "types" => ["thumbnail_image", "original_image"]}} = json_response
    assert ExJsonSchema.Validator.valid?(@schema, json_response)
  end

  test "GET /files/:project yields deleted fiels flagged as deleted", %{conn: conn} do
    credentials = Base.encode64("#{@user_name}:#{@user_password}")

    conn =
      conn
      |> put_req_header("authorization", "Basic #{credentials}")
      |> put_req_header("content-type", "image/png")
      |> put("/files/test_project/1234?type=original_image", @exampleFile)

    assert conn.status == 201

    conn =
      conn
      |> recycle()
      |> put_req_header("authorization", "Basic #{credentials}")
      |> get("/files/test_project")

    json_response =
      conn.resp_body
      |> Jason.decode!()

    assert %{"1234" => %{"deleted" => false, "types" => ["original_image"]}} = json_response
    assert ExJsonSchema.Validator.valid?(@schema, json_response)

    conn =
      conn
      |> recycle()
      |> put_req_header("authorization", "Basic #{credentials}")
      |> delete("/files/test_project/1234")

    assert conn.status == 200

    conn =
      conn
      |> recycle()
      |> put_req_header("authorization", "Basic #{credentials}")
      |> get("/files/test_project")

    json_response =
      conn.resp_body
      |> Jason.decode!()

    assert %{"1234" => %{"deleted" => true, "types" => ["original_image"]}} = json_response
    assert ExJsonSchema.Validator.valid?(@schema, json_response)
  end


  test "DELETE /files/:project/:uuid deletes file with specified uuid", %{conn: conn} do
    credentials = Base.encode64("#{@user_name}:#{@user_password}")

    conn =
      conn
      |> put_req_header("authorization", "Basic #{credentials}")
      |> put_req_header("content-type", "image/png")
      |> put("/files/test_project/1234?type=original_image", @exampleFile)

    assert conn.status == 201


    conn =
      conn
      |> recycle()
      |> put_req_header("authorization", "Basic #{credentials}")
      |> put_req_header("content-type", "image/png")
      |> put("/files/test_project/5678?type=original_image", @exampleFile)

    assert conn.status == 201

    conn =
      conn
      |> recycle()
      |> put_req_header("authorization", "Basic #{credentials}")
      |> get("/files/test_project")

    json_response =
      conn.resp_body
      |> Jason.decode!()

    assert %{
      "1234" => %{"deleted" => false, "types" => ["original_image"]},
      "5678" => %{"deleted" => false, "types" => ["original_image"]}
    } = json_response
    assert ExJsonSchema.Validator.valid?(@schema, json_response)

    conn =
      conn
      |> recycle()
      |> put_req_header("authorization", "Basic #{credentials}")
      |> delete("/files/test_project/1234")

    assert conn.status == 200

    conn =
      conn
      |> recycle()
      |> put_req_header("authorization", "Basic #{credentials}")
      |> get("/files/test_project")

    json_response =
      conn.resp_body
      |> Jason.decode!()

    assert %{
      "1234" => %{"deleted" => true, "types" => ["original_image"]},
      "5678" => %{"deleted" => false, "types" => ["original_image"]}
    } = json_response
    assert ExJsonSchema.Validator.valid?(@schema, json_response)
  end
end
