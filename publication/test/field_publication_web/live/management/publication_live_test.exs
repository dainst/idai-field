defmodule FieldPublicationWeb.Management.PublicationLiveTest do
  alias FieldPublication.Processing
  alias FieldPublication.Publications
  alias FieldPublication.Replication
  alias FieldPublication.DocumentSchema.ReplicationInput
  alias FieldPublication.Projects
  alias FieldPublication.CouchService
  alias FieldPublication.DocumentSchema.Project

  use FieldPublicationWeb.ConnCase
  import Phoenix.LiveViewTest

  @core_database Application.compile_env(:field_publication, :core_database)
  @test_project_name "test_project_a"
  @test_user %FieldPublication.DocumentSchema.User{
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
      publication =
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

  test "can create a new publication through replicating from FieldHub", %{conn: conn} do
    conn = log_in_user(conn, Application.get_env(:field_publication, :couchdb_admin_name))

    assert {:ok, live_process, _html} =
             live(conn, ~p"/management/projects/#{@test_project_name}/publication/new")

    assert live_process
           |> form("#replication-form", %{
             replication_input: %{
               source_url: FieldHubHelper.get_url(),
               source_user: FieldHubHelper.get_admin_name(),
               source_password: FieldHubHelper.get_admin_password(),
               source_project_name: "testopolis",
               delete_existing_publication: true
             }
           })
           |> render_submit()
           |> follow_redirect(conn)

    {publication_path, _flash} = assert_redirect(live_process, 5000)

    assert {:ok, live_process, html} = live(conn, publication_path)

    assert html =~ "Publication draft"
  end
end
