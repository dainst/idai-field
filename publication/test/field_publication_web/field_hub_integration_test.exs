defmodule FieldPublicationWeb.FieldHubIntegrationTest do
  use FieldPublicationWeb.ConnCase

  import Phoenix.LiveViewTest
  import FieldPublication.Test.DataScaffolding

  @moduledoc """
  This test will actually start a Field Hub instance in the background and go
  through the complete replication and preprocessing steps once.
  """

  alias FieldPublication.{
    EmbeddedSchema.LogEntry,
    FileService,
    Project,
    Publication,
    User
  }

  setup_all [
    :field_hub,
    :create_core_database,
    :add_editor_user,
    :add_admin_user,
    :add_projects
  ]

  def field_hub(context) do
    FieldHubHelper.start()

    on_exit(fn ->
      FieldHubHelper.stop()
    end)

    context
  end

  @tag timeout: 1000 * 60 * 5
  test "can create a new publication through replicating from FieldHub", %{
    conn: conn,
    project_a: %Project{identifier: project_identifier} = _project_a,
    editor: %User{} = editor
  } do
    conn = log_in_user(conn, editor.name)

    assert {:ok, live_process, _html} =
             live(conn, ~p"/management/projects/#{project_identifier}/publication/new")

    pid = live_process.pid
    :erlang.trace(pid, true, [:receive])

    _html =
      live_process
      |> form("#replication-form", %{
        replication_input: %{
          source_url: FieldHubHelper.get_url(),
          source_user: FieldHubHelper.get_admin_name(),
          source_password: FieldHubHelper.get_admin_password(),
          source_project_identifier: "testopolis",
          delete_existing_publication: true
        }
      })
      |> render_submit()

    {publication_path, _flash} = assert_redirect(live_process, 5000)

    assert {:ok, live_process, html} = live(conn, publication_path)

    assert html =~
             "Publication <span>draft </span>\n  &#39;#{Date.utc_today()}&#39; for project &#39;#{project_identifier}&#39;"

    assert_receive(
      {_publication_id, {:replication_stopped}},
      1000 * 60
    )

    %Publication{
      doc_type: "publication",
      project_identifier: ^project_identifier,
      drafted_by: "couch_admin",
      replication_logs: logs
    } = Publication.get!(project_identifier, "#{Date.utc_today()}")

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

    assert_receive {_publication_id, {:processing_started, :search_index}}
    assert_receive {_publication_id, {:processing_started, :tile_images}}
    assert_receive {_publication_id, {:processing_started, :web_images}}

    assert_receive {_publication_id, {:processing_stopped, :search_index}}, 1000 * 20
    assert_receive {_publication_id, {:processing_stopped, :tile_images}}, 1000 * 20
    assert_receive {_publication_id, {:processing_stopped, :web_images}}, 1000 * 20

    %{image: image_uuids} =
      FileService.list_raw_data_files(project_identifier)

    raw_images_count = Enum.count(image_uuids)

    web_files_count =
      project_identifier
      |> FileService.list_web_image_files()
      |> Enum.count()

    tiles_count =
      project_identifier
      |> FileService.list_tile_image_directories()
      |> Enum.count()

    assert raw_images_count == web_files_count
    assert tiles_count == 2

    html = render(live_process)

    # save button is only visible after replication
    assert html =~ "Save changes"
  end
end
