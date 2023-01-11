defmodule FieldHub.CouchServiceTest do
  alias FieldHub.{
    CouchService,
    CouchService.Credentials,
    TestHelper
  }

  use ExUnit.Case

  @project "test"
  @user_name "test_user"
  @user_password "test_password"

  @valid_credentials %Credentials{name: @user_name, password: @user_password}

  setup_all %{} do
    # Run before all tests
    TestHelper.create_complete_example_project(@project, @user_name, @user_password)

    on_exit(fn ->
      # Run after all tests
      TestHelper.remove_complete_example_project(
        @project,
        @user_name
      )
    end)
  end

  test "authenticate/1 with valid credentials yields `ok`" do
    result = CouchService.authenticate(@valid_credentials)
    assert :ok = result
  end

  test "authenticate/1 with invalid credentials yields 401" do
    result = CouchService.authenticate(%Credentials{name: @user_name, password: "nope"})
    assert {:error, 401} = result
  end

  test "authenticate_and_authorize/2 with valid and authorized credentials yields :ok" do
    result = CouchService.authenticate_and_authorize(@valid_credentials, @project)
    assert :ok = result
  end

  test "authenticate_and_authorize/2 with invalid credentials yields 401" do
    result =
      CouchService.authenticate_and_authorize(
        %Credentials{name: @user_name, password: "nope"},
        @project
      )

    assert {:error, %HTTPoison.Response{status_code: 401}} = result
  end

  test "authenticate_and_authorize/2 with valid but unauthorized credentials yields 403" do
    other_project = "other_test_project"
    other_user = "other_user_name"
    TestHelper.create_test_db_and_user(other_project, other_user, "other_password")

    result = CouchService.authenticate_and_authorize(@valid_credentials, other_project)
    assert {:error, %HTTPoison.Response{status_code: 403}} = result

    TestHelper.remove_test_db_and_user(other_project, other_user)
  end

  test "get_all_databases/0 returns a list of databases" do
    # The tests use the same CouchDB instance as the development context, so development
    # databases will show up here and we have to make a diff comparison.

    extra_project = "couch_test_extra_project"

    databases = CouchService.get_all_databases()
    assert is_list(databases)
    initial_count = Enum.count(databases)

    TestHelper.create_test_db_and_user(extra_project, extra_project, "pw")

    databases = CouchService.get_all_databases()
    assert is_list(databases)
    assert initial_count + 1 == Enum.count(databases)
    assert extra_project in databases

    TestHelper.remove_test_db_and_user(extra_project, extra_project)
  end

  test "get_docs/2 returns a project's documents with the given UUIDs" do
    assert [
             %{
               "_id" => "o25"
             },
             %{
               "_id" => "o26"
             }
           ] = CouchService.get_docs(@project, ["o25", "o26"])
  end

  test "get_docs/2 returns error for unknown uuids" do
    assert [
             %{
               "_id" => "o25"
             },
             {
               :error,
               %{error: "not_found", reason: "missing", uuid: "unknown"}
             }
           ] = CouchService.get_docs(@project, ["o25", "unknown"])
  end

  test "get_docs_by_category/2 returns a project's documents matching the given types" do
    assert [
             %{
               "_id" => "o25",
               "resource" => %{
                 "id" => "o25",
                 "type" => "Drawing"
               }
             },
             %{
               "_id" => "o26",
               "resource" => %{
                 "id" => "o26",
                 "type" => "Image"
               }
             }
           ] = CouchService.get_docs_by_category(@project, ["Image", "Drawing"]) |> Enum.to_list()
  end
end
