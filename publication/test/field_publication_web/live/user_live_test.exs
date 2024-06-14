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

      assert {:error, :invalid} =
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

      assert {:ok, :valid} =
               CouchService.authenticate(
                 @added_user_params["name"],
                 @added_user_params["password"]
               )
    end

    test "has to add name, label and password when creating a user", %{conn: conn} do
      assert {:ok, live_process, _html} = live(conn, ~p"/management/users")

      assert live_process
             |> element(~s([href="/management/users/new"]))
             |> render_click()

      assert_patch(live_process, ~p"/management/users/new")

      assert live_process
             |> form("#user-form", %{user: %{}})
             |> render_submit()

      assert live_process
             |> element(~s(div[phx-feedback-for=\"user[name]\"]))
             |> render() =~ "can&#39;t be blank"

      assert live_process
             |> element(~s(div[phx-feedback-for=\"user[label]\"]))
             |> render() =~ "can&#39;t be blank"

      assert live_process
             |> element(~s(div[phx-feedback-for=\"user[password]\"]))
             |> render() =~ "can&#39;t be blank"
    end

    test "can generate new user password when creating a user", %{conn: conn} do
      assert {:ok, live_process, _html} = live(conn, ~p"/management/users")

      assert live_process
             |> element(~s([href="/management/users/new"]))
             |> render_click()

      assert_patch(live_process, ~p"/management/users/new")

      assert not (live_process |> element("#user_password") |> render() =~ "value=")

      assert live_process
             |> element(~s([phx-click="generate_password"]))
             |> render_click()

      html = live_process |> element("#user_password") |> render()

      assert html =~ "value="

      # `/U` at the end makes the match ungreedy, meaning the match stops at the first whitespace encounted
      # instead of matching until the last `" ` occurence in the whole html string.
      [_all, generated_password] = Regex.run(~r/value=\"(.+)\" /U, html)

      assert String.length(generated_password) == String.length(CouchService.generate_password())
    end

    test "can edit a user label", %{conn: conn} do
      assert {:ok, live_process, html} = live(conn, ~p"/management/users")

      assert html =~ "<td class=\"text-left\">#{@test_user.label}</td>"
      assert not (html =~ "<td class=\"text-left\">Test user updated</td>")

      assert live_process
             |> element(~s([href="/management/users/#{@test_user.name}/edit"]))
             |> render_click()

      assert_patch(live_process, ~p"/management/users/#{@test_user.name}/edit")

      assert live_process
             |> form("#user-form", %{
               user: %{label: "Test user updated"}
             })
             |> render_submit()

      assert_patch(live_process, ~p"/management/users")

      html = render(live_process)

      assert not (html =~ "<td class=\"text-left\">#{@test_user.label}</td>")
      assert html =~ "<td class=\"text-left\">Test user updated</td>"
    end

    test "can set new user password", %{conn: conn} do
      assert {:ok, live_process, _html} = live(conn, ~p"/management/users")

      new_password = "updated_password"

      assert {:ok, :valid} =
               CouchService.authenticate(
                 @test_user.name,
                 @test_user.password
               )

      assert {:error, :invalid} =
               CouchService.authenticate(
                 @test_user.name,
                 new_password
               )

      assert live_process
             |> element(~s([href="/management/users/#{@test_user.name}/edit"]))
             |> render_click()

      assert_patch(live_process, ~p"/management/users/#{@test_user.name}/edit")

      assert live_process
             |> form("#user-form", %{
               user: %{password: new_password}
             })
             |> render_submit()

      assert_patch(live_process, ~p"/management/users")

      assert {:ok, :valid} =
               CouchService.authenticate(
                 @test_user.name,
                 new_password
               )

      assert {:error, :invalid} =
               CouchService.authenticate(
                 @test_user.name,
                 @test_user.password
               )
    end

    test "can generate new user password when editing a user", %{conn: conn} do
      assert {:ok, live_process, _html} = live(conn, ~p"/management/users")

      assert {:ok, :valid} =
               CouchService.authenticate(
                 @test_user.name,
                 @test_user.password
               )

      assert live_process
             |> element(~s([href="/management/users/#{@test_user.name}/edit"]))
             |> render_click()

      assert_patch(live_process, ~p"/management/users/#{@test_user.name}/edit")

      assert not (live_process |> element("#user_password") |> render() =~ "value=")

      assert live_process
             |> element(~s([phx-click="generate_password"]))
             |> render_click()

      html = live_process |> element("#user_password") |> render()

      assert html =~ "value="

      # `/U` at the end makes the match ungreedy, meaning the match stops at the first whitespace encounted
      # instead of matching until the last `" ` occurence in the whole html string.
      [_all, generated_password] = Regex.run(~r/value=\"(.+)\" /U, html)

      assert String.length(generated_password) == String.length(CouchService.generate_password())
    end

    test "when editing has empty password ignored", %{conn: conn} do
      assert {:ok, live_process, _html} = live(conn, ~p"/management/users")

      new_password = "   \n\n "

      assert {:ok, :valid} =
               CouchService.authenticate(
                 @test_user.name,
                 @test_user.password
               )

      assert {:error, :invalid} =
               CouchService.authenticate(
                 @test_user.name,
                 new_password
               )

      assert live_process
             |> element(~s([href="/management/users/#{@test_user.name}/edit"]))
             |> render_click()

      assert_patch(live_process, ~p"/management/users/#{@test_user.name}/edit")

      assert live_process
             |> form("#user-form", %{
               user: %{password: new_password}
             })
             |> render_submit()

      assert_patch(live_process, ~p"/management/users")

      assert {:error, :invalid} =
               CouchService.authenticate(
                 @test_user.name,
                 new_password
               )

      assert {:ok, :valid} =
               CouchService.authenticate(
                 @test_user.name,
                 @test_user.password
               )
    end
  end
end
