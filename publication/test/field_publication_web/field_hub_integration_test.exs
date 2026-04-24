defmodule FieldPublicationWeb.FieldHubIntegrationTest do
  use FieldPublicationWeb.ConnCase

  @moduledoc """
  This test will actually start a Field Hub instance in the background and go
  through the complete replication and preprocessing steps once.
  """

  @core_database Application.compile_env(:field_publication, :core_database)
  @test_project_name "field_hub_integration_test"

  alias FieldPublication.{
    CouchService,
    FileService,
    Replication,
    Processing,
    Projects,
    Publications
  }

  alias FieldPublication.DatabaseSchema.{
    Project,
    Publication,
    LogEntry
  }

  import Phoenix.LiveViewTest

  setup_all %{} do
    FieldHubHelper.start()
    CouchService.put_database(@core_database)

    Projects.put(%Project{}, %{"name" => @test_project_name})

    project = Projects.get!(@test_project_name)

    on_exit(fn ->
      Publications.get(@test_project_name, Date.utc_today())
      |> case do
        {:ok, publication} ->
          Replication.stop(publication)
          Processing.stop(publication)
          Publications.delete(publication)

        _ ->
          :ok
      end

      Projects.delete(project)
      CouchService.delete_database(@core_database)
      FieldHubHelper.stop()
    end)

    %{test_project: project}
  end

  @tag timeout: 1000 * 60 * 5
  test "can create a new publication through replicating from FieldHub", %{conn: conn} do
    conn = log_in_user(conn, Application.get_env(:field_publication, :couchdb_admin_name))

    assert {:ok, live_process, _html} =
             live(conn, ~p"/management/projects/#{@test_project_name}/publication/new")

    pid = live_process.pid
    :erlang.trace(pid, true, [:receive])

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

    assert html =~
             "Publication <span>draft </span>\n  &#39;#{Date.utc_today()}&#39; for project &#39;#{@test_project_name}&#39;"

    assert_receive(
      {:replication_stopped},
      1000 * 60
    )

    %Publication{
      doc_type: "publication",
      project_name: @test_project_name,
      drafted_by: "couch_admin",
      replication_logs: logs
    } = Publications.get!(@test_project_name, "#{Date.utc_today()}")

    assert %LogEntry{
             # The rest would be something containing a date like: ""Replicating database for publication_test_project_a_<current date> by first replicating the database."
             message: "Replicating database for " <> _rest,
             timestamp: _,
             severity: :info
           } = List.first(logs)

    assert %LogEntry{
             message: "Draft creation finished.",
             timestamp: _,
             severity: :info
           } = List.last(logs)

    assert_receive {:processing_started, :search_index}
    assert_receive {:processing_started, :tile_images}
    assert_receive {:processing_started, :web_images}

    assert_receive {:processing_stopped, :search_index}, 1000 * 20
    assert_receive {:processing_stopped, :tile_images}, 1000 * 20
    assert_receive {:processing_stopped, :web_images}, 1000 * 20

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

    # save button is only visible after replication
    assert html =~ "Save changes"
  end
end
