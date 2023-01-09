defmodule FieldHub.CLITest do
  alias FieldHub.{
    CLI,
    TestHelper
  }

  import ExUnit.CaptureLog

  use ExUnit.Case

  @project_name "test_project"
  @user_password "test_password"

  setup %{} do
    # Run before all tests
    TestHelper.remove_test_db_and_user(@project_name, @project_name)
    :ok
  end

  test "setup/1 works without error" do
    log =
      capture_log(fn ->
        assert :ok = CLI.setup()
      end)

    assert log =~ "Running initial CouchDB setup for single node"
    assert log =~ "Setup done."
  end

  test "create_project/1" do
    log =
      capture_log(fn ->
        assert :ok = CLI.create_project(@project_name)
      end)

    assert log =~ "CREATING PROJECT"
    assert log =~ "Project creation done."
  end

  test "create_project/1 twice should warn about its existence" do
    log =
      capture_log(fn ->
        assert :ok = CLI.create_project(@project_name)
        assert :ok = CLI.create_project(@project_name)
      end)

    assert log =~ "CREATING PROJECT"
    assert log =~ "Project creation done."
    assert log =~ "[warning] Project database '#{@project_name}' already exists."
  end

  test "create_project/2 should log the requested password" do
    log =
      capture_log(fn ->
        assert :ok = CLI.create_project(@project_name, @user_password)
      end)

    assert log =~ "Created user '#{@project_name}' with password '#{@user_password}'."
  end

  test "delete_project/1" do
    log =
      capture_log(fn ->
        assert :ok = CLI.create_project(@project_name)
        assert :ok = CLI.delete_project(@project_name)
      end)

    assert log =~ "[info] Deleted project database '#{@project_name}'."
    assert log =~ "[info] Deleted project's user '#{@project_name}'."
  end

  test "delete_project/1 on an unknown project should print warning" do
    log =
      capture_log(fn ->
        assert :ok = CLI.delete_project(@project_name)
      end)

    assert log =~ "[warning] Project database '#{@project_name}' does not exists."
  end

  test "create_user/1" do
    log =
      capture_log(fn ->
        assert :ok = CLI.create_user(@project_name)
      end)

    assert log =~ "Created user '#{@project_name}' with password"
  end

  test "create_user/1 twice should print warning" do
    log =
      capture_log(fn ->
        assert :ok = CLI.create_user(@project_name)
        assert :ok = CLI.create_user(@project_name)
      end)

    assert log =~ "User '#{@project_name}' already exists."
  end

  test "create_user/2" do
    assert :ok = CLI.create_user(@project_name, @user_password)
  end

  test "delete_user/1" do
    assert :ok = CLI.create_user(@project_name)
    assert :ok = CLI.delete_user(@project_name)
  end

  test "delete_user/1 on unknown user should not throw an error" do
    assert :ok = CLI.delete_user(@project_name)
  end

  test "set_password/2" do
    assert :ok = CLI.set_password(@project_name, @user_password)
  end

  test "add_user_as_project_admin/2" do
    assert :ok = CLI.create_project(@project_name)
    assert :ok = CLI.add_user_as_project_admin(@project_name, @project_name)
  end

  test "add_user_as_project_member/2" do
    assert :ok = CLI.create_project(@project_name)
    assert :ok = CLI.add_user_as_project_member(@project_name, @project_name)
  end

  test "remove_user_from_project/2" do
    assert :ok = CLI.create_project(@project_name)
    assert :ok = CLI.add_user_as_project_member(@project_name, @project_name)
  end

  test "get_project_statistics/1" do
    statistics_log =
      capture_log(fn ->
        assert :ok = CLI.create_project(@project_name)
        assert :ok = CLI.get_project_statistics(@project_name)
      end)

    assert statistics_log =~ "######### Project 'test_project' #########"
    assert statistics_log =~ "##########################################"
  end

  test "get_project_issues/1" do
    log =
      capture_log(fn ->
        assert :ok = CLI.create_project(@project_name)
        assert :ok = CLI.get_project_issues(@project_name)
      end)

    assert log =~ "Issue: no_project_document."
  end
end
