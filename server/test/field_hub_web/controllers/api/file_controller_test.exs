defmodule FieldHubWeb.Api.FileControllerTest do
  use FieldHubWeb.ConnCase

  alias FieldHub.{
    FileStore,
    TestHelper
  }

  @cache_name Application.compile_env(:field_hub, :file_info_cache_name)

  @project "test_project"
  @user_name "test_user"
  @user_password "test_password"
  @example_file_path "test/fixtures/logo.png"
  @example_file File.read!(@example_file_path)
  @example_file_stats File.stat!("test/fixtures/logo.png")
  @schema File.read!("../core/api-schemas/files-list.json")
          |> Jason.decode!()
          |> ExJsonSchema.Schema.resolve()

  @basic_auth "Basic #{Base.encode64("#{@user_name}:#{@user_password}")}"

  setup_all %{} do
    TestHelper.create_test_db_and_user(@project, @user_name, @user_password)

    on_exit(fn ->
      TestHelper.remove_test_db_and_user(@project, @user_name)
    end)
  end

  setup %{} do
    FileStore.create_directories(@project)

    on_exit(fn ->
      FileStore.remove_directories(@project)
      Cachex.clear!(@cache_name)
    end)
  end

  test "PUT /files/:project/:uuid creates file with specified uuid and type", %{conn: conn} do
    credentials = Base.encode64("#{@user_name}:#{@user_password}")

    conn =
      conn
      |> put_req_header("authorization", "Basic #{credentials}")
      |> put_req_header("content-type", "image/png")
      |> put("/files/#{@project}/1234?type=original_image", @example_file)

    assert conn.status == 201
  end

  test "PUT /files/:project/:uuid with unsupported type throws 400", %{conn: conn} do
    conn =
      conn
      |> put_req_header("authorization", @basic_auth)
      |> put_req_header("content-type", "image/png")
      |> put("/files/#{@project}/1234?type=unsupported", @example_file)

    assert conn.status == 400
  end

  test "PUT /files/:project/:uuid with file exceeding maximum size throws 413", %{conn: conn} do
    roughly_20_mb = String.duplicate("0123456789", 2_000_000)

    conn =
      conn
      |> put_req_header("authorization", @basic_auth)
      |> put_req_header("content-type", "image/png")
      |> put("/files/#{@project}/1234?type=original_image", roughly_20_mb)

    assert conn.status == 413
  end

  test "GET /files/:project/:uuid returns 404 for non-existent file", %{conn: conn} do
    credentials = Base.encode64("#{@user_name}:#{@user_password}")

    conn =
      conn
      |> put_req_header("authorization", "Basic #{credentials}")
      |> get("/files/#{@project}/1234?type=original_image")

    assert conn.status == 404
  end

  test "GET /files/:project/:uuid returns 400 without type parameter", %{conn: conn} do
    credentials = Base.encode64("#{@user_name}:#{@user_password}")

    conn =
      conn
      |> recycle()
      |> put_req_header("authorization", "Basic #{credentials}")
      |> get("/files/#{@project}/1234")

    assert conn.status == 400
  end

  test "GET /files/:project/:uuid returns 400 with invalid type parameter", %{conn: conn} do
    credentials = Base.encode64("#{@user_name}:#{@user_password}")

    conn =
      conn
      |> put_req_header("authorization", "Basic #{credentials}")
      |> get("/files/#{@project}/1234?type=unknown")

    assert conn.status == 400
  end

  test "GET /files/:project/:uuid returns existing file", %{conn: conn} do
    credentials = Base.encode64("#{@user_name}:#{@user_password}")

    conn =
      conn
      |> put_req_header("authorization", "Basic #{credentials}")
      |> put_req_header("content-type", "image/png")
      |> put("/files/#{@project}/1234?type=original_image", @example_file)

    assert conn.status == 201

    conn =
      conn
      |> recycle()
      |> put_req_header("authorization", "Basic #{credentials}")
      |> get("/files/#{@project}/1234?type=original_image")

    assert conn.status == 200
    assert conn.resp_body == @example_file
  end

  test "GET /files/:project without valid credentials yields 401", %{conn: conn} do
    credentials = Base.encode64("non_existant_user:made_up_password")

    conn =
      conn
      |> put_req_header("authorization", "Basic #{credentials}")
      |> get("/files/#{@project}")

    assert conn.status == 401
  end

  test "GET /files/:project without files yields valid json", %{conn: conn} do
    credentials = Base.encode64("#{@user_name}:#{@user_password}")

    conn =
      conn
      |> put_req_header("authorization", "Basic #{credentials}")
      |> get("/files/#{@project}")

    assert conn.status == 200

    json_response =
      conn.resp_body
      |> Jason.decode!()

    assert json_response == %{}
    assert ExJsonSchema.Validator.valid?(@schema, json_response)
  end

  test "GET /files/:project with files yields valid json", %{conn: conn} do
    credentials = Base.encode64("#{@user_name}:#{@user_password}")

    conn =
      conn
      |> put_req_header("authorization", "Basic #{credentials}")
      |> put_req_header("content-type", "image/png")
      |> put("/files/#{@project}/1234?type=original_image", @example_file)

    assert conn.status == 201

    conn =
      conn
      |> recycle()
      |> put_req_header("authorization", "Basic #{credentials}")
      |> get("/files/#{@project}")

    json_response =
      conn.resp_body
      |> Jason.decode!()

    file_size = @example_file_stats.size

    assert %{
             "1234" => %{
               "deleted" => false,
               "types" => ["original_image"],
               "variants" => [%{"name" => "original_image", "size" => ^file_size}]
             }
           } = json_response

    assert ExJsonSchema.Validator.valid?(@schema, json_response)
  end

  test "GET /files/:project different file variants get added to the response", %{conn: conn} do
    credentials = Base.encode64("#{@user_name}:#{@user_password}")

    conn =
      conn
      |> put_req_header("authorization", "Basic #{credentials}")
      |> put_req_header("content-type", "image/png")
      |> put("/files/#{@project}/1234?type=original_image", @example_file)

    assert conn.status == 201

    conn =
      conn
      |> recycle()
      |> put_req_header("authorization", "Basic #{credentials}")
      |> get("/files/#{@project}")

    json_response =
      conn.resp_body
      |> Jason.decode!()

    assert ExJsonSchema.Validator.valid?(@schema, json_response)

    conn =
      conn
      |> recycle()
      |> put_req_header("authorization", "Basic #{credentials}")
      |> put_req_header("content-type", "image/png")
      |> put("/files/#{@project}/1234?type=thumbnail_image", @example_file)

    assert conn.status == 201

    conn =
      conn
      |> recycle()
      |> put_req_header("authorization", "Basic #{credentials}")
      |> get("/files/#{@project}")

    assert conn.status == 200

    json_response =
      conn.resp_body
      |> Jason.decode!()

    file_size = @example_file_stats.size

    assert %{
             "1234" => %{
               "deleted" => false,
               "types" => ["thumbnail_image", "original_image"],
               "variants" => [
                 %{"name" => "thumbnail_image", "size" => ^file_size},
                 %{"name" => "original_image", "size" => ^file_size}
               ]
             }
           } = json_response

    assert ExJsonSchema.Validator.valid?(@schema, json_response)
  end

  test "GET /files/:project only specified file variant gets added to the response", %{conn: conn} do
    conn =
      conn
      |> put_req_header("authorization", @basic_auth)
      |> put_req_header("content-type", "image/png")
      |> put("/files/#{@project}/1234?type=original_image", @example_file)

    assert conn.status == 201

    conn =
      conn
      |> recycle()
      |> put_req_header("authorization", @basic_auth)
      |> put_req_header("content-type", "image/png")
      |> put("/files/#{@project}/1234?type=thumbnail_image", @example_file)

    assert conn.status == 201

    conn =
      conn
      |> recycle()
      |> put_req_header("authorization", @basic_auth)
      |> get("/files/#{@project}?types[]=original_image")

    json_response =
      conn.resp_body
      |> Jason.decode!()

    assert conn.status == 200

    assert ExJsonSchema.Validator.valid?(@schema, json_response)

    variants = json_response["1234"]["variants"]

    assert [%{"name" => "original_image"}] = variants
  end

  test "GET /files/:project specified but unsupported file variant throws 400", %{conn: conn} do
    conn =
      conn
      |> put_req_header("authorization", @basic_auth)
      |> get("/files/#{@project}?types[]=unsupported")

    assert conn.status == 400
  end

  test "GET /files/:project non array types parameter throws 400", %{conn: conn} do
    conn =
      conn
      |> put_req_header("authorization", @basic_auth)
      |> get("/files/#{@project}?types=unsupported")

    assert conn.status == 400
  end

  test "DELETE /files/:project/:uuid deletes files with specified uuid", %{conn: conn} do
    credentials = Base.encode64("#{@user_name}:#{@user_password}")

    conn =
      conn
      |> put_req_header("authorization", "Basic #{credentials}")
      |> put_req_header("content-type", "image/png")
      |> put("/files/#{@project}/1234?type=original_image", @example_file)

    assert conn.status == 201

    conn =
      conn
      |> recycle()
      |> put_req_header("authorization", "Basic #{credentials}")
      |> put_req_header("content-type", "image/png")
      |> put("/files/#{@project}/5678?type=original_image", @example_file)

    assert conn.status == 201

    conn =
      conn
      |> recycle()
      |> put_req_header("authorization", "Basic #{credentials}")
      |> get("/files/#{@project}")

    json_response =
      conn.resp_body
      |> Jason.decode!()

    assert %{
             "1234" => %{"deleted" => false},
             "5678" => %{"deleted" => false}
           } = json_response

    assert ExJsonSchema.Validator.valid?(@schema, json_response)

    conn =
      conn
      |> recycle()
      |> put_req_header("authorization", "Basic #{credentials}")
      |> delete("/files/#{@project}/1234")

    assert conn.status == 200

    conn =
      conn
      |> recycle()
      |> put_req_header("authorization", "Basic #{credentials}")
      |> get("/files/#{@project}")

    json_response =
      conn.resp_body
      |> Jason.decode!()

    assert %{
             "1234" => %{"deleted" => true},
             "5678" => %{"deleted" => false}
           } = json_response

    assert ExJsonSchema.Validator.valid?(@schema, json_response)
  end

  test "GET /files/:project yields deleted fields flagged as deleted", %{conn: conn} do
    credentials = Base.encode64("#{@user_name}:#{@user_password}")

    conn =
      conn
      |> put_req_header("authorization", "Basic #{credentials}")
      |> put_req_header("content-type", "image/png")
      |> put("/files/#{@project}/1234?type=original_image", @example_file)

    assert conn.status == 201

    conn =
      conn
      |> recycle()
      |> put_req_header("authorization", "Basic #{credentials}")
      |> get("/files/#{@project}")

    json_response =
      conn.resp_body
      |> Jason.decode!()

    assert %{"1234" => %{"deleted" => false}} = json_response
    assert ExJsonSchema.Validator.valid?(@schema, json_response)

    conn =
      conn
      |> recycle()
      |> put_req_header("authorization", "Basic #{credentials}")
      |> delete("/files/#{@project}/1234")

    assert conn.status == 200

    conn =
      conn
      |> recycle()
      |> put_req_header("authorization", "Basic #{credentials}")
      |> get("/files/#{@project}")

    json_response =
      conn.resp_body
      |> Jason.decode!()

    assert %{"1234" => %{"deleted" => true}} = json_response
    assert ExJsonSchema.Validator.valid?(@schema, json_response)
  end
end
