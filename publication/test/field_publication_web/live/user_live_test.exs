defmodule FieldPublicationWeb.UserLiveTest do
  use FieldPublicationWeb.ConnCase

  import Phoenix.LiveViewTest

  alias FieldPublication.CouchService

  @test_user %FieldPublication.DocumentSchema.User{
    name: "test_user",
    password: "pw",
    label: "Test user"
  }

  @added_user_params %{
    "name" => "added_user",
    "password" => "pw",
    "label" => "Added user"
  }

  setup do
    CouchService.create_user(@test_user)

    on_exit(fn ->
      CouchService.delete_user(@test_user.name)
    end)
  end

  test "non administrators have no access to the view", %{conn: conn} do
    # Error without login
    assert {
             :error,
             {:redirect,
              %{to: _, flash: %{"error" => "You are not allowed to access that page."}}}
           } = live(conn, ~p"/management/users")

    conn = recycle(conn)
    log_in_user(conn, @test_user.name)

    # Error for logged in user that is not administrator
    assert {
             :error,
             {:redirect,
              %{to: _, flash: %{"error" => "You are not allowed to access that page."}}}
           } = live(conn, ~p"/management/users")
  end

  describe "the administrator" do
    setup %{conn: conn} do
      conn = log_in_user(conn, Application.get_env(:field_publication, :couchdb_admin_name))

      %{conn: conn}
    end

    test "has access to the view", %{conn: conn} do
      assert {:ok, _live_process, html} = live(conn, ~p"/management/users")

      assert html =~ "Manage users"
      assert html =~ "<td class=\"text-left\">#{@test_user.name}</td>"
      assert html =~ "<td class=\"text-left\">#{@test_user.label}</td>"
    end

    test "can create a new user", %{conn: conn} do
      on_exit(fn ->
        CouchService.delete_user(@added_user_params["name"])
      end)

      assert {:ok, live_process, html} = live(conn, ~p"/management/users")

      assert not (html =~ "<td class=\"text-left\">#{@added_user_params["name"]}</td>")
      assert not (html =~ "<td class=\"text-left\">#{@added_user_params["label"]}</td>")

      assert {:error, :unauthorized} =
               CouchService.authenticate(
                 @added_user_params["name"],
                 @added_user_params["password"]
               )

      assert live_process
             |> element(~s([href="/management/users/new"]))
             |> render_click()

      assert_patch(live_process, ~p"/management/users/new")

      html = render(live_process)
      assert html =~ "New user"

      assert live_process
             |> form("#user-form", %{user: @added_user_params})
             |> render_submit()

      assert_patch(live_process, ~p"/management/users")

      html = render(live_process)

      assert html =~ "<td class=\"text-left\">#{@added_user_params["name"]}</td>"
      assert html =~ "<td class=\"text-left\">#{@added_user_params["label"]}</td>"

      assert {:ok, :authenticated} =
               CouchService.authenticate(
                 @added_user_params["name"],
                 @added_user_params["password"]
               )
    end
  end
end
