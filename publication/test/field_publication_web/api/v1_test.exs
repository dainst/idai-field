defmodule FieldPublicationWeb.Api.V1Test do
  use FieldPublicationWeb.ConnCase

  import OpenApiSpex.TestAssertions
  import FieldPublication.Test.DataScaffolding

  alias FieldPublication.{
    Publication,
    Project,
    User
  }

  setup_all [
    :create_core_database,
    :add_editor_user,
    :add_admin_user,
    :add_projects_and_empty_publications
  ]

  test "general index omits projects without any publications", %{
    conn: conn,
    project_c: %Project{identifier: identifier},
    administrator: %User{name: name, password: password}
  } do
    json =
      conn
      |> add_basic_auth(name, password)
      |> get(~p"/api/v1/")
      |> json_response(200)

    assert nil ==
             Enum.find(json, fn %{"project_identifier" => id} ->
               id == identifier
             end)

    api_spec = FieldPublicationWeb.Api.spec()
    assert_schema(json, "ProjectList", api_spec)
  end

  test "general index produces list of all published publications for anonymous users", %{
    conn: conn,
    published_project_a: %Publication{
      project_identifier: project_identifier,
      draft_date: draft_date
    }
  } do
    draft_date_string = Date.to_string(draft_date)

    assert json =
             [
               %{
                 "project_identifier" => ^project_identifier,
                 "publications" => [^draft_date_string]
               }
             ] =
             conn
             |> get(~p"/api/v1/")
             |> json_response(200)

    api_spec = FieldPublicationWeb.Api.spec()
    assert_schema(json, "ProjectList", api_spec)
  end

  test "general index produces list of all publications an editor has access to", %{
    conn: conn,
    published_project_a: %Publication{
      project_identifier: project_identifier,
      draft_date: draft_date_published
    },
    unpublished_project_a: %Publication{
      project_identifier: project_identifier,
      draft_date: draft_date_unpublished
    },
    editor: %User{name: name, password: password}
  } do
    draft_date_published_string = Date.to_string(draft_date_published)
    draft_date_unpublished_string = Date.to_string(draft_date_unpublished)

    assert json =
             [
               %{
                 "project_identifier" => ^project_identifier,
                 "publications" => [^draft_date_published_string, ^draft_date_unpublished_string]
               }
             ] =
             conn
             |> add_basic_auth(name, password)
             |> get(~p"/api/v1/")
             |> json_response(200)

    api_spec = FieldPublicationWeb.Api.spec()
    assert_schema(json, "ProjectList", api_spec)
  end

  test "general index produces list of all publications for administrator", %{
    conn: conn,
    published_project_a: %Publication{
      project_identifier: project_identifier_a,
      draft_date: draft_date_published_a
    },
    unpublished_project_a: %Publication{
      project_identifier: project_identifier_a,
      draft_date: draft_date_unpublished_a
    },
    unpublished_project_b: %Publication{
      project_identifier: project_identifier_b,
      draft_date: draft_date_unpublished_b
    },
    administrator: %User{name: name, password: password}
  } do
    draft_date_published_string_a = Date.to_string(draft_date_published_a)
    draft_date_unpublished_string_a = Date.to_string(draft_date_unpublished_a)
    draft_date_unpublished_string_b = Date.to_string(draft_date_unpublished_b)

    assert json =
             [
               %{
                 "project_identifier" => ^project_identifier_a,
                 "publications" => [
                   ^draft_date_published_string_a,
                   ^draft_date_unpublished_string_a
                 ]
               },
               %{
                 "project_identifier" => ^project_identifier_b,
                 "publications" => [^draft_date_unpublished_string_b]
               }
             ] =
             conn
             |> add_basic_auth(name, password)
             |> get(~p"/api/v1/")
             |> json_response(200)

    api_spec = FieldPublicationWeb.Api.spec()
    assert_schema(json, "ProjectList", api_spec)
  end
end
