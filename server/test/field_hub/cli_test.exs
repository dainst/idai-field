# defmodule FieldHub.CLITest do
#   alias FieldHub.{
#     CLI,
#     FileStore,
#     TestHelper
#   }

#   use ExUnit.Case, async: true

#   @project "test_project"
#   @user_name "test_user"

#   setup_all %{} do
#     # Run before all tests
#     TestHelper.remove_test_db_and_user(@project, @user_name)

#     :ok
#   end

#   test "can create and delete project, duplicate just result in warning" do
#     assert %{couch: %{status_code: 201}, file_store: [:thumbnail_image, :original_image]} =
#              CLI.create_project(@project)

#     assert %{status_code: 200} = TestHelper.database_exists?(@project)

#     # Another creation attempt should just warn that the database exists
#     assert %{couch: %{status_code: 412}, file_store: [:thumbnail_image, :original_image]} =
#              CLI.create_project(@project)

#     assert %{status_code: 200} = TestHelper.database_exists?(@project)

#     assert %{couch: %{status_code: 200}, file_store: []} = CLI.delete_project(@project)
#     assert %{status_code: 404} = TestHelper.database_exists?(@project)

#     # Hacky?: Files are currently not beeing deleted by the CLI
#     # we need to delete them manually using the FileStore.
#     {:ok, deleted_files} = FileStore.remove_directories(@project)

#     Enum.each(deleted_files, fn path ->
#       assert not File.exists?(path)
#     end)
#   end
# end
