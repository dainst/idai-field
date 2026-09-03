defmodule FieldPublicationWeb.Rest.Api.V1Test do
  use FieldPublicationWeb.ConnCase

  import OpenApiSpex.TestAssertions

  alias FieldPublication.{
    CouchService,
    Projects,
    Users
  }

  alias FieldPublication.DatabaseSchema.{
    Project
  }

  alias FieldPublication.Test.ProjectSeed

  @core_database Application.compile_env(:field_publication, :core_database)

  @test_editor_name "test_editor"
  @test_editor_password "test_editor_password"
  @test_project_identifier_a "test_project_a"
  @test_project_identifier_b "test_project_b"
  @empty_project_identifier "empty_project_identifier"
  @unpublished_draft_date "2024-11-23"

  setup_all %{} do
    CouchService.put_database(@core_database)
    {project_a, _publication} = ProjectSeed.create_full_publication(@test_project_identifier_a)

    {:ok, user} =
      Users.create(%{
        name: @test_editor_name,
        password: @test_editor_password,
        label: "some user"
      })

    _publication =
      ProjectSeed.add_unpublished(@test_project_identifier_a, @unpublished_draft_date)

    {project_b, _publication} =
      ProjectSeed.create_full_publication(@test_project_identifier_b, false, false)

    {:ok, project_b} = Projects.add_user(project_b, user)

    {:ok, empty_project} = Projects.put(%Project{}, %{identifier: @empty_project_identifier})

    on_exit(fn ->
      Enum.each([empty_project, project_a, project_b], &Projects.delete/1)
      Users.delete(@test_editor_name)
      CouchService.delete_database(@core_database)
    end)
  end

  test "general index omits projects without any publications", %{conn: conn} do
    json =
      conn
      |> add_admin_basic_auth()
      |> get(~p"/api/v1/")
      |> json_response(200)

    assert nil ==
             Enum.find(json, fn %{"project_identifier" => id} ->
               id == @empty_project_identifier
             end)

    api_spec = FieldPublicationWeb.Api.spec()
    assert_schema(json, "ProjectList", api_spec)
  end

  test "general index produces list of all published publications for anonymous users", %{
    conn: conn
  } do
    assert json =
             [
               %{
                 "project_identifier" => "test_project_a",
                 "publications" => ["2024-06-05"]
               }
             ] =
             conn
             |> get(~p"/api/v1/")
             |> json_response(200)

    api_spec = FieldPublicationWeb.Api.spec()
    assert_schema(json, "ProjectList", api_spec)
  end

  test "general index produces list of all publications an editor has access to", %{conn: conn} do
    # User is only editor for test_project_identifier_b, so should not see the draft for
    # test_project_identifier_a.

    assert json =
             [
               %{
                 "project_identifier" => @test_project_identifier_a,
                 "publications" => ["2024-06-05"]
               },
               %{
                 "project_identifier" => @test_project_identifier_b,
                 "publications" => ["2024-06-05"]
               }
             ] =
             conn
             |> add_basic_auth(@test_editor_name, @test_editor_password)
             |> get(~p"/api/v1/")
             |> json_response(200)

    api_spec = FieldPublicationWeb.Api.spec()
    assert_schema(json, "ProjectList", api_spec)
  end

  test "general index produces list of all publications for administrator", %{conn: conn} do
    assert json =
             [
               %{
                 "project_identifier" => @test_project_identifier_a,
                 "publications" => ["2024-06-05", @unpublished_draft_date]
               },
               %{
                 "project_identifier" => @test_project_identifier_b,
                 "publications" => ["2024-06-05"]
               }
             ] =
             conn
             |> add_admin_basic_auth()
             |> get(~p"/api/v1/")
             |> json_response(200)

    api_spec = FieldPublicationWeb.Api.spec()
    assert_schema(json, "ProjectList", api_spec)
  end
end
