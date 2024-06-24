# defmodule FieldPublication.ReplicationTest do
#   use ExUnit.Case

#   alias FieldPublication.CouchService
#   alias FieldPublication.Replication
#   alias FieldPublication.Projects
#   alias FieldPublication.Publications

#   alias FieldPublication.DocumentSchema.{
#     Project,
#     Publication,
#     ReplicationInput,
#     Translation,
#     LogEntry
#   }

#   @fieldhub_fixture_dir "test/support/fixtures/field_hub"
#   @core_database Application.compile_env(:field_publication, :core_database)
#   @project_name "test"

#   setup_all do
#     System.cmd("docker-compose", ["up", "--wait"], cd: @fieldhub_fixture_dir)

#     # Wait for FieldHub to initialize.
#     Process.sleep(2000)

#     on_exit(fn ->
#       System.cmd("docker-compose", ["down"], cd: @fieldhub_fixture_dir)
#     end)

#     :ok
#   end

#   describe "tests running against field hub instance" do
#     setup do
#       CouchService.put_database(@core_database)
#       {:ok, project} = Projects.put(%Project{}, %{"name" => @project_name})

#       on_exit(fn ->
#         CouchService.delete_database(@core_database)

#         # Ugly, this assumes the tests and on the same day they are started, which is not guaranteed.
#         CouchService.delete_database("publication_test_#{Date.utc_today()}")
#         Projects.delete(project)
#       end)

#       :ok
#     end

#     test "can replicate from FieldHub" do
#       {:ok, _initial_state, task_pid} =
#         Replication.start(%ReplicationInput{
#           source_url: "http://localhost:4003",
#           source_project_name: "test",
#           source_user: "test",
#           source_password: "pw",
#           project_name: @project_name,
#           comments: [
#             %Translation{language: "de", text: "ein test"},
#             %Translation{language: "en", text: "a test"}
#           ]
#         })

#       ref = Process.monitor(task_pid)

#       # Should the replication task crash for any reason, a different message will be received.
#       assert_receive {:DOWN, ^ref, :process, _object, :normal}, 20_000

#       assert [
#                %Publication{
#                  _rev: _,
#                  doc_type: "publication",
#                  project_name: "test",
#                  source_url: "http://localhost:4003",
#                  source_project_name: "test",
#                  draft_date: _,
#                  publication_date: nil,
#                  configuration_doc: configuration_doc,
#                  database: publication_database,
#                  comments: [
#                    %Translation{text: "ein test", language: "de"},
#                    %Translation{text: "a test", language: "en"}
#                  ],
#                  replication_logs: [
#                    %LogEntry{
#                      severity: :info,
#                      timestamp: _,
#                      message: "Starting replication for test."
#                    },
#                    %LogEntry{
#                      severity: :info,
#                      timestamp: _,
#                      message: "Starting database replication."
#                    },
#                    %LogEntry{
#                      severity: :info,
#                      timestamp: _,
#                      message: "21 database documents need replication."
#                    },
#                    %LogEntry{
#                      severity: :info,
#                      timestamp: _,
#                      message: "Database replication has finished."
#                    },
#                    %LogEntry{
#                      severity: :info,
#                      timestamp: _,
#                      message: "Starting file replication."
#                    },
#                    %LogEntry{
#                      severity: :info,
#                      timestamp: _,
#                      message: "2 files need replication."
#                    },
#                    %LogEntry{
#                      severity: :info,
#                      timestamp: _,
#                      message: "File replication has finished."
#                    },
#                    %LogEntry{
#                      severity: :info,
#                      timestamp: _,
#                      message: "Creating publication metadata."
#                    },
#                    %LogEntry{
#                      severity: :info,
#                      timestamp: _,
#                      message: "Publication metadata created."
#                    },
#                    %LogEntry{
#                      severity: :info,
#                      timestamp: _,
#                      message: "Replication finished."
#                    }
#                  ]
#                }
#              ] = Publications.list(%Project{name: @project_name})

#       assert {:ok, %{status: 200}} = CouchService.get_document(configuration_doc)

#       # The "project" document should always be present in the database for any replicated project.
#       assert {:ok, %{status: 200}} = CouchService.get_document("project", publication_database)
#     end
#   end
# end
