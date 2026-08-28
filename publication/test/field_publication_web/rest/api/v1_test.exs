defmodule FieldPublicationWeb.Rest.Api.V1Test do
  use FieldPublicationWeb.ConnCase

  import OpenApiSpex.TestAssertions

  alias FieldPublication.{
    CouchService,
    Projects
  }

  alias FieldPublication.DatabaseSchema.Project

  alias FieldPublication.Test.ProjectSeed

  @core_database Application.compile_env(:field_publication, :core_database)
  @test_project_identifier "test_project_a"

  test "V1 index produces empty project list response when there are no publications or projects",
       %{conn: conn} do
    CouchService.put_database(@core_database)

    on_exit(fn ->
      CouchService.delete_database(@core_database)
    end)

    [] =
      json =
      conn
      |> get(~p"/api/v1/")
      |> json_response(200)

    api_spec = FieldPublicationWeb.Api.spec()
    assert_schema(json, "ProjectList", api_spec)
  end

  test "V1 index produces expected project list response", %{conn: conn} do
    CouchService.put_database(@core_database)

    {_project, _publication} = ProjectSeed.start(@test_project_identifier, false)

    on_exit(fn ->
      Projects.get(@test_project_identifier)
      |> case do
        {:ok, %Project{} = project} ->
          Projects.delete(project)

        _ ->
          :ok
      end

      CouchService.delete_database(@core_database)
    end)

    json =
      [
        %{"project_identifier" => "test_project_a", "publications" => ["2024-06-05"]}
      ] =
      conn
      |> get(~p"/api/v1/")
      |> json_response(200)

    api_spec = FieldPublicationWeb.Api.spec()
    assert_schema(json, "ProjectList", api_spec)
  end
end
