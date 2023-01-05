defmodule FieldHub.StatisticsTest do
  alias FieldHub.{
    Statistics,
    FileStore,
    TestHelper
  }

  use ExUnit.Case, async: true

  @project "test_project"
  @project_b "test_project_b"
  @user_name "test_user"
  @user_password "test_password"
  @file_store_cache Application.compile_env(:field_hub, :file_info_cache_name)

  defp setup_test_file_store() do
    FileStore.create_directories(@project)

    FileStore.store_file(
      "file_a",
      @project,
      :original_image,
      String.duplicate("0123456789", 10_000)
    )

    FileStore.store_file(
      "file_b",
      @project,
      :original_image,
      String.duplicate("0123456789", 10_000)
    )

    FileStore.store_file(
      "file_c",
      @project,
      :original_image,
      String.duplicate("0123456789", 10_000)
    )

    FileStore.delete("file_c", @project)
  end

  setup_all %{} do

    setup_test_file_store()
    # Run before all tests
    TestHelper.create_test_db_and_user(@project, @user_name, @user_password)
    TestHelper.create_test_db_and_user(@project_b, @user_name, @user_password)

    on_exit(fn ->
      # Run after all tests
      TestHelper.remove_project(@project_b)
      TestHelper.remove_test_db_and_user(@project, @user_name)

      # Run after each test
      Cachex.del(@file_store_cache, @project)
      FileStore.remove_directories(@project)
    end)

    :ok
  end

  test "evaluate_project/1 returns the expected values" do
    assert %{
             database: %{doc_count: 0, file_size: 33076},
             files: %{
               original_image: %{active: 2, active_size: 200_000, deleted: 1, deleted_size: 0},
               thumbnail_image: %{active: 0, active_size: 0, deleted: 0, deleted_size: 0}
             },
             name: "test_project"
           } = Statistics.evaluate_project(@project)
  end

  test "evaluate_all_projects_for_user/1 returns the expected values" do
    assert [
             %{
               database: %{doc_count: 0, file_size: 33076},
               files: %{
                 original_image: %{active: 2, active_size: 200_000, deleted: 1, deleted_size: 0},
                 thumbnail_image: %{active: 0, active_size: 0, deleted: 0, deleted_size: 0}
               },
               name: "test_project"
             },
             %{
               database: %{doc_count: 0, file_size: 33076},
               files: %{
                 original_image: %{active: 0, active_size: 0, deleted: 0, deleted_size: 0},
                 thumbnail_image: %{active: 0, active_size: 0, deleted: 0, deleted_size: 0}
               },
               name: "test_project_b"
             }
           ] = Statistics.evaluate_all_projects_for_user(@user_name)
  end

  test "missing file directory for project returns :enoent" do
    FileStore.remove_directories(@project)

    assert %{
      database: %{doc_count: 0, file_size: 33076},
      files: :enoent,
      name: "test_project"
    } = Statistics.evaluate_project(@project)

    # Run setup to get to initial state for other tests.
    setup_test_file_store()
  end
end
