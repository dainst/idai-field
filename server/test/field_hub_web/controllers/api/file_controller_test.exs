defmodule FieldHubWeb.Api.FileControllerTest do
  use FieldHubWeb.ConnCase

  alias FieldHub.{
    TestHelper,
    FileStore
  }

  @project "test_project"
  @user_name "test_user"
  @user_password "test_password"
  @file_directory_root Application.get_env(:field_hub, :file_directory_root)

  @schema File.read!("../core/api-schemas/files-list.json")
    |> Jason.decode!()
    |> ExJsonSchema.Schema.resolve()

  setup_all do
    on_exit(fn ->
      # Run after all tests
      File.rm_rf!(@file_directory_root)
    end)
  end

  setup do
    # Run before each test
    TestHelper.create_test_db_and_user(@project, @user_name, @user_password)

    on_exit(fn ->
      # Run after each test
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


  test "GET /files/:project without images yields valid json", %{conn: conn} do

    credentials = Base.encode64("#{@user_name}:#{@user_password}")

    conn =
      conn
      |> put_req_header("authorization", "Basic #{credentials}")
      |> get("/files/test_project")

    json_response =
      conn.resp_body
      |> Jason.decode!()

    assert json_response == %{}
    assert ExJsonSchema.Validator.valid?(@schema, json_response)
  end

  test "GET /files/:project with image yields valid json", %{conn: conn} do

    credentials = Base.encode64("#{@user_name}:#{@user_password}")

    content = File.read!("test/fixtures/logo.png")

    FileStore.store_file(%{uuid: "1234", project: @project, type: :original_image, content: content})

    conn =
      conn
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

    content = File.read!("test/fixtures/logo.png")

    FileStore.store_file(%{uuid: "1234", project: @project, type: :original_image, content: content})

    conn =
      conn
      |> put_req_header("authorization", "Basic #{credentials}")
      |> get("/files/test_project")

    json_response =
      conn.resp_body
      |> Jason.decode!()

    assert %{"1234" => %{"deleted" => false, "types" => ["original_image"]}} = json_response
    assert ExJsonSchema.Validator.valid?(@schema, json_response)

    FileStore.store_file(%{uuid: "1234", project: @project, type: :thumbnail_image, content: content})

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

  test "GET /files/:project yields files with tombstones flagged as deleted", %{conn: conn} do
    credentials = Base.encode64("#{@user_name}:#{@user_password}")

    content = File.read!("test/fixtures/logo.png")

    FileStore.store_file(%{uuid: "1234", project: @project, type: :original_image, content: content})

    conn =
      conn
      |> put_req_header("authorization", "Basic #{credentials}")
      |> get("/files/test_project")

    json_response =
      conn.resp_body
      |> Jason.decode!()

    assert %{"1234" => %{"deleted" => false, "types" => ["original_image"]}} = json_response
    assert ExJsonSchema.Validator.valid?(@schema, json_response)

    FileStore.delete(%{uuid: "1234", project: @project})

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
end
