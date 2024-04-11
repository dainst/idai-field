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

  test "get_all_databases/0 does not return internal databases or databases without application user" do
    # Without the app user (see config.exs) added to the database, this database is considered outside of FieldHub:
    # `FieldHub.Project.create/1` would additionally call `CouchService.update_user_role_in_project/3`.
    outside_project = "outside_field_hub"

    CouchService.create_database(outside_project)

    databases = CouchService.get_all_databases()

    assert outside_project not in databases
    assert "_security" not in databases
    assert "_users" not in databases

    CouchService.delete_database(outside_project)
  end

  test "get_docs/2 returns a project's documents with the given UUIDs" do
    %HTTPoison.Response{status_code: 200, body: body} =
      CouchService.get_docs(@project, ["o25", "o26"])

    assert %{
             "rows" => [
               %{
                 "id" => "o25",
                 "doc" => %{
                   "_id" => "o25",
                   "_rev" => _,
                   "created" => %{
                     "date" => _,
                     "user" => "sample_data"
                   },
                   "modified" => [
                     %{"date" => _, "user" => "sample_data"}
                   ],
                   "resource" => %{
                     "georeference" => _,
                     "height" => 2423,
                     "id" => "o25",
                     "identifier" => "PE07-So-07_Z001.jpg",
                     "originalFilename" => "PE07-So-07_Z001.jpg",
                     "relations" => %{"isMapLayerOf" => ["project"]},
                     "shortDescription" => %{
                       "de" => "Kartenhintergrund 1",
                       "en" => "Map layer 1",
                       "it" => "Immagine di sfondo 1",
                       "uk" => "Підоснова 1"
                     },
                     "category" => "Drawing",
                     "width" => 3513
                   }
                 }
               },
               %{
                 "id" => "o26",
                 "doc" => %{
                   "_id" => "o26",
                   "_rev" => _,
                   "created" => %{
                     "date" => _,
                     "user" => "sample_data"
                   },
                   "modified" => [
                     %{"date" => _, "user" => "sample_data"}
                   ],
                   "resource" => %{
                     "georeference" => _,
                     "height" => 782,
                     "id" => "o26",
                     "identifier" => "mapLayerTest2.png",
                     "originalFilename" => "mapLayerTest2.png",
                     "relations" => %{"isMapLayerOf" => ["project"]},
                     "shortDescription" => %{
                       "de" => "Kartenhintergrund 2",
                       "en" => "Map layer 2",
                       "it" => "Immagine di sfondo 2",
                       "uk" => "Підоснова 2"
                     },
                     "category" => "Image",
                     "width" => 748
                   }
                 }
               }
             ]
           } = Jason.decode!(body)
  end

  test "get_docs/2 returns error for unknown uuids" do
    %HTTPoison.Response{status_code: 200, body: body} =
      CouchService.get_docs(@project, ["o25", "unknown"])

    assert %{
             "rows" => [
               %{
                 "id" => "o25",
                 "doc" => _
               },
               %{"error" => "not_found", "key" => "unknown"}
             ]
           } = Jason.decode!(body)
  end

  test "get_docs_by_category/2 returns a project's documents matching the given types" do
    assert [
             %{
               "_id" => "o25",
               "resource" => %{
                 "id" => "o25",
                 "category" => "Drawing"
               }
             },
             %{
               "_id" => "o26",
               "resource" => %{
                 "id" => "o26",
                 "category" => "Image"
               }
             }
           ] = CouchService.get_docs_by_category(@project, ["Image", "Drawing"]) |> Enum.to_list()
  end

  test "get_last_5_changes/1 return up to 5 last changes" do
    assert [
             %{"changes" => [%{"rev" => _}], "id" => _, "seq" => _, "doc" => _},
             %{"changes" => [%{"rev" => _}], "id" => _, "seq" => _, "doc" => _},
             %{"changes" => [%{"rev" => _}], "id" => _, "seq" => _, "doc" => _},
             %{"changes" => [%{"rev" => _}], "id" => _, "seq" => _, "doc" => _},
             %{"changes" => [%{"rev" => _}], "id" => _, "seq" => _, "doc" => _}
           ] = CouchService.get_last_5_changes(@project)
  end

  test "get_last_change_date/2 return date and author of a change" do
    # assert {"2023-01-05T10:32:09.2"<>_<>" (edited by sample_data)"} = CouchService.get_last_change_date(List.first(CouchService.get_last_5_changes(@project)),@project)
    assert ["2023-01-05T10:32:09.", _] = [
             String.split(
               CouchService.get_last_change_date(
                 List.first(CouchService.get_last_5_changes(@project)),
                 @project
               ),
               "."
             )
           ]
  end
end
