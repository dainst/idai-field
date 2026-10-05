defmodule FieldPublicationWeb.UI.Management.UserLiveTest do
  use FieldPublicationWeb.ConnCase

  import Phoenix.LiveViewTest
  import FieldPublication.Test.DataScaffolding

  alias FieldPublication.{
    CouchService,
    User
  }

  setup_all [
    :create_core_database,
    :add_editor_user,
    :add_admin_user
  ]

  test "non administrators have no access to the view", %{conn: conn, editor: %User{name: name}} do
    # Error without authentication.
    assert {
             :error,
             {:redirect,
              %{to: _, flash: %{"error" => "You are not allowed to access that page."}}}
           } = live(conn, ~p"/management/users")

    conn = recycle(conn)
    log_in_user(conn, name)

    # Error for logged in user that is not administrator.
    assert {
             :error,
             {:redirect,
              %{to: _, flash: %{"error" => "You are not allowed to access that page."}}}
           } = live(conn, ~p"/management/users")
  end

  describe "the administrator" do
    setup %{conn: conn, administrator: %User{name: admin_name}} = context do
      conn = log_in_user(conn, admin_name)

      password = "1234567890qwertz"

      {:ok, user} =
        User.create(%{
          name: "user_live_test_user",
          password: password,
          label: "User Live Test",
          email: "user_live_test_user@example.org"
        })

      on_exit(fn ->
        User.get(user.name)
        |> case do
          {:ok, %User{} = maybe_updated_in_test} ->
            User.delete(maybe_updated_in_test)

          _ ->
            nil
        end
      end)

      # User.create will not return with a set password, but we want to provide it for the tests.
      user = Map.put(user, :password, password)

      Map.put(context, :administrator, user)

      %{conn: conn, local_user: user}
    end

    test "has access to the view", %{conn: conn, administrator: admin, editor: editor} do
      assert {:ok, _live_process, html} = live(conn, ~p"/management/users")

      assert html =~ "Manage users"
      assert html =~ "<td>#{admin.name}</td>"
      assert html =~ "<td>#{admin.label}</td>"
      assert html =~ "<td>#{editor.name}</td>"
      assert html =~ "<td>#{editor.label}</td>"
    end

    test "can create a new user", %{conn: conn} do
      added_user_params = %{
        "name" => "added_user",
        "password" => "1111111111111111111",
        "label" => "Added user",
        "email" => "addedUser@example.org"
      }

      on_exit(fn ->
        User.get(added_user_params["name"])
        |> case do
          {:ok, %User{} = hopefully_created_in_test} ->
            User.delete(hopefully_created_in_test)

          _ ->
            nil
        end
      end)

      assert {:ok, live_process, html} = live(conn, ~p"/management/users")

      refute html =~ "<td>#{added_user_params["name"]}</td>"
      refute html =~ "<td >#{added_user_params["label"]}</td>"

      assert {:error, :invalid} =
               CouchService.authenticate(
                 added_user_params["name"],
                 added_user_params["password"]
               )

      assert live_process
             |> element(~s([href="/management/users/new"]))
             |> render_click()

      assert_patch(live_process, ~p"/management/users/new")

      html = render(live_process)
      assert html =~ "New user"

      assert live_process
             |> form("#user-form", %{user: added_user_params})
             |> render_submit()

      assert_patch(live_process, ~p"/management/users")

      html = render(live_process)

      assert html =~ "<td>#{added_user_params["name"]}</td>"
      assert html =~ "<td>#{added_user_params["label"]}</td>"

      assert {:ok, :valid} =
               CouchService.authenticate(
                 added_user_params["name"],
                 added_user_params["password"]
               )
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

    test "can edit a user label", %{conn: conn, local_user: user} do
      assert {:ok, live_process, html} = live(conn, ~p"/management/users")

      initial_label = user.label
      updated_label = "Test user updated"

      assert {:ok, :valid} =
               CouchService.authenticate(
                 user.name,
                 user.password
               )

      assert html =~ "<td>#{initial_label}</td>"
      refute html =~ "<td>#{updated_label}</td>"

      assert live_process
             |> element(~s([href="/management/users/#{user.name}/edit"]))
             |> render_click()

      assert_patch(live_process, ~p"/management/users/#{user.name}/edit")

      assert live_process
             |> form("#user-form", %{
               user: %{label: updated_label}
             })
             |> render_submit()

      assert_patch(live_process, ~p"/management/users")

      html = render(live_process)

      refute html =~ "<td>#{initial_label}</td>"
      assert html =~ "<td>#{updated_label}</td>"

      {:ok, %User{label: db_label}} = User.get(user.name)

      assert db_label == updated_label

      assert {:ok, :valid} =
               CouchService.authenticate(
                 user.name,
                 user.password
               )
    end

    test "can set new user password", %{conn: conn, local_user: user} do
      assert {:ok, live_process, _html} = live(conn, ~p"/management/users")

      initial_password = user.password
      new_password = "updated_password"

      assert {:ok, :valid} =
               CouchService.authenticate(
                 user.name,
                 initial_password
               )

      assert {:error, :invalid} =
               CouchService.authenticate(
                 user.name,
                 new_password
               )

      assert live_process
             |> element(~s([href="/management/users/#{user.name}/edit"]))
             |> render_click()

      assert_patch(live_process, ~p"/management/users/#{user.name}/edit")

      assert live_process
             |> form("#user-form", %{
               user: %{password: new_password}
             })
             |> render_submit()

      assert_patch(live_process, ~p"/management/users")

      assert {:error, :invalid} =
               CouchService.authenticate(
                 user.name,
                 initial_password
               )

      assert {:ok, :valid} =
               CouchService.authenticate(
                 user.name,
                 new_password
               )
    end

    test "can generate new user password when editing a user", %{conn: conn, local_user: user} do
      assert {:ok, live_process, _html} = live(conn, ~p"/management/users")

      initial_password = user.password

      assert {:ok, :valid} =
               CouchService.authenticate(
                 user.name,
                 initial_password
               )

      assert live_process
             |> element(~s([href="/management/users/#{user.name}/edit"]))
             |> render_click()

      assert_patch(live_process, ~p"/management/users/#{user.name}/edit")

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

      assert live_process
             |> form("#user-form", %{
               user: %{password: generated_password}
             })
             |> render_submit()

      assert_patch(live_process, ~p"/management/users")

      assert {:error, :invalid} =
               CouchService.authenticate(
                 user.name,
                 initial_password
               )

      assert {:ok, :valid} =
               CouchService.authenticate(
                 user.name,
                 generated_password
               )
    end

    test "when editing has empty password ignored", %{conn: conn, local_user: user} do
      assert {:ok, live_process, _html} = live(conn, ~p"/management/users")

      initial_password = user.password
      new_password = "   \n\n                  \t\t "

      assert {:ok, :valid} =
               CouchService.authenticate(
                 user.name,
                 initial_password
               )

      assert {:error, :invalid} =
               CouchService.authenticate(
                 user.name,
                 new_password
               )

      assert live_process
             |> element(~s([href="/management/users/#{user.name}/edit"]))
             |> render_click()

      assert_patch(live_process, ~p"/management/users/#{user.name}/edit")

      assert live_process
             |> form("#user-form", %{
               user: %{password: new_password}
             })
             |> render_submit()

      assert_patch(live_process, ~p"/management/users")

      assert {:error, :invalid} =
               CouchService.authenticate(
                 user.name,
                 new_password
               )

      assert {:ok, :valid} =
               CouchService.authenticate(
                 user.name,
                 initial_password
               )
    end
  end
end
