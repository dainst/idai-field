defmodule FieldPublicationWeb.Management.PublicationLiveTest do
  alias FieldPublication.Processing
  alias FieldPublication.Publications
  alias FieldPublication.Projects
  alias FieldPublication.CouchService
  alias FieldPublication.DatabaseSchema.Project

  use FieldPublicationWeb.ConnCase
  import Phoenix.LiveViewTest

  @core_database Application.compile_env(:field_publication, :core_database)
  @test_project_name "test_project_a"
  @test_user %FieldPublication.DatabaseSchema.User{
    name: "test_user",
    password: "pw",
    label: "Test user"
  }

  setup_all %{} do
    FieldHubHelper.start()
    CouchService.put_database(@core_database)
    CouchService.create_user(@test_user)

    Projects.put(%Project{}, %{"name" => @test_project_name})

    project = Projects.get!(@test_project_name)

    on_exit(fn ->
      Publications.get(@test_project_name, Date.utc_today())
      |> case do
        {:ok, publication} ->
          Publications.delete(publication)
          Processing.stop(publication)

        _ ->
          :ok
      end

      Projects.delete(project)
      CouchService.delete_database(@core_database)
      CouchService.delete_user(@test_user.name)
      FieldHubHelper.stop()
    end)

    %{test_project: project}
  end

  test "only the administrator or editors have access to the input view", %{conn: conn} do
    # Error without being logged in
    assert {
             :error,
             {:redirect,
              %{to: _, flash: %{"error" => "You are not allowed to access that page."}}}
           } = live(conn, ~p"/management/projects/#{@test_project_name}/publication/new")

    conn = recycle(conn)
    log_in_user(conn, @test_user.name)

    # Error for logged in user that is not defined as project editor
    assert {
             :error,
             {:redirect,
              %{to: _, flash: %{"error" => "You are not allowed to access that page."}}}
           } = live(conn, ~p"/management/projects/#{@test_project_name}/publication/new")
  end

  test "editors have access to the input view", %{conn: conn} do
    @test_project_name
    |> Projects.get!()
    |> Projects.put(%{"editors" => [@test_user.name]})

    conn = log_in_user(conn, @test_user.name)

    on_exit(fn ->
      @test_project_name
      |> Projects.get!()
      |> Projects.put(%{"editors" => []})
    end)

    assert {:ok, _live_process, html} =
             live(conn, ~p"/management/projects/#{@test_project_name}/publication/new")

    assert html =~ "Create new publication draft"
  end

  test "administrators have access to the input view", %{conn: conn} do
    conn = log_in_user(conn, Application.get_env(:field_publication, :couchdb_admin_name))

    assert {:ok, _live_process, html} =
             live(conn, ~p"/management/projects/#{@test_project_name}/publication/new")

    assert html =~ "Create new publication draft"
  end
end
