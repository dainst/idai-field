defmodule FieldPublicationWeb.Management.PublicationLiveTest do
  alias FieldPublication.FileService
  alias FieldPublication.Processing
  alias FieldPublication.Publications
  alias FieldPublication.Projects
  alias FieldPublication.CouchService
  alias FieldPublication.DocumentSchema.Project
  alias FieldPublication.DocumentSchema.LogEntry

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

  @tag timeout: 1000 * 60 * 5
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

    {publication_path, _flash} = assert_redirect(live_process, 5000)

    assert {:ok, live_process, html} = live(conn, publication_path)

    pid = live_process.pid
    :erlang.trace(pid, true, [:receive])

    assert html =~ "Publication draft"

    assert_receive {
      :replication_log,
      %LogEntry{
        severity: :info,
        timestamp: _,
        # The rest would be something containing a date like: "publication_test_project_a_2024-06-17 by first replicating the database."
        message: "Starting replication for " <> _rest
      }
    }

    assert_receive(
      {
        :trace,
        ^pid,
        :receive,
        {
          :replication_result,
          %FieldPublication.DocumentSchema.Publication{
            _rev: _,
            doc_type: "publication",
            project_name: @test_project_name,
            source_url: _,
            source_project_name: _,
            draft_date: _,
            drafted_by: "couch_admin",
            replication_finished: _,
            publication_date: nil,
            configuration_doc: _config_doc,
            hierarchy_doc: _hierarchy_doc,
            database: _database,
            languages: ["de", "en"],
            version: :major,
            comments: [],
            replication_logs: logs,
            processing_logs: []
          }
        }
      },
      1000 * 60
    )

    assert %LogEntry{
             # The rest would be something containing a date like: "Starting replication for publication_test_project_a_2024-06-17 by first replicating the database."
             message: "Starting replication for publication" <> _rest,
             timestamp: _,
             severity: :info
           } = List.first(logs)

    assert %LogEntry{
             message: "Replication finished.",
             timestamp: _,
             severity: :info
           } = List.last(logs)

    assert_receive {:trace, ^pid, :receive, {:processing_started, :search_index}}

    assert_receive {:trace, ^pid, :receive, {:processing_started, :tile_images}}

    assert_receive {:trace, ^pid, :receive, {:processing_started, :web_images}}

    assert_receive {:trace, ^pid, :receive, {:processing_stopped, :search_index}}, 1000 * 20

    assert_receive {:trace, ^pid, :receive, {:processing_stopped, :tile_images}}, 1000 * 20

    assert_receive {:trace, ^pid, :receive, {:processing_stopped, :web_images}}, 1000 * 20

    %{image: image_uuids} =
      FileService.list_raw_data_files(@test_project_name)

    raw_images_count = Enum.count(image_uuids)

    web_files_count =
      @test_project_name
      |> FileService.list_web_image_files()
      |> Enum.count()

    tiles_count =
      @test_project_name
      |> FileService.list_tile_image_directories()
      |> Enum.count()

    assert raw_images_count == web_files_count
    assert tiles_count == 2

    html = render(live_process)

    assert html =~ "Publication draft"
    # save button is only visible after replication
    assert html =~ "Save changes"
  end
end
