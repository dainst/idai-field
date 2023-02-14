defmodule FieldHubWeb.PageControllerTest do
  use FieldHubWeb.ConnCase

  alias FieldHub.TestHelper
  alias FieldHubWeb.UserAuth

  @project "test_project"
  @user_name "test_user"
  @user_password "test_password"

  test "GET /", %{conn: conn} do
    conn = get(conn, "/")
    assert html_response(conn, 200) =~ "FieldHub"
  end

  describe "Test user -" do
    setup %{conn: conn} do
      # Run before each test
      TestHelper.create_test_db_and_user(@project, @user_name, @user_password)

      on_exit(fn ->
        # Run after each test
        TestHelper.remove_test_db_and_user(@project, @user_name)
      end)

      conn =
        conn
        |> Map.replace!(:secret_key_base, FieldHubWeb.Endpoint.config(:secret_key_base))
        |> init_test_session(%{})

      %{conn: conn}
    end

    test "GET / with valid session token displays projects", %{conn: conn} do
      token = UserAuth.generate_user_session_token(@user_name)

      conn =
        conn
        |> put_session(:user_token, token)
        |> get("/")

      assert html_response(conn, 200) =~ "/projects/show/test_project"
    end

    test "GET / without valid session token does not display projects", %{conn: conn} do
      conn =
        conn
        |> get("/")

      assert not String.contains?(html_response(conn, 200), "/projects/show/test_project")
    end
  end
end
