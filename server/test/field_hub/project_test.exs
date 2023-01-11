defmodule FieldHub.ProjectTest do
  alias FieldHub.{
    FileStore,
    User,
    Project,
    TestHelper
  }

  use ExUnit.Case

  @project "test"
  @user_name "test_user"
  @user_password "test_password"

  test "exists?/1 correctly returns false" do
    assert false == Project.exists?(@project)
  end

  test "can create project with a given name" do
    %{database: :created, file_store: %{original_image: :ok, thumbnail_image: :ok}} =
      Project.create(@project)

    %{database: :deleted, file_store: []} = Project.delete(@project)
  end

  describe "Test user manipulation -" do
    setup %{} do
      Project.create(@project)
      User.create(@user_name, @user_password)

      on_exit(fn ->
        Project.delete(@project)
        User.delete(@user_name)
      end)
    end

    test "exists?/1 correctly returns true" do
      assert true == Project.exists?(@project)
    end

    test "can add user as admininstrator" do
      assert :set = Project.update_user(@user_name, @project, :admin)
    end

    test "trying unknown user as admininstrator is reported" do
      assert :unknown_user = Project.update_user("unknown", @project, :admin)
    end

    test "trying to add admin to unknown project is reported" do
      assert :unknown_project = Project.update_user(@user_name, "unknown", :admin)
    end

    test "can add user as member" do
      assert :set = Project.update_user(@user_name, @project, :member)
    end

    test "trying to add unknown user as member is reported" do
      assert :unknown_user = Project.update_user("unknown", @project, :member)
    end

    test "trying to add member to unknown project is reported" do
      assert :unknown_project = Project.update_user(@user_name, "unknown", :member)
    end

    test "can remove user" do
      assert :unset = Project.update_user(@user_name, @project, :none)
    end

    test "trying to remove unknown user is reported" do
      assert :unknown_user = Project.update_user("unknown", @project, :none)
    end

    test "trying to remove user from unknown project is reported" do
      assert :unknown_project = Project.update_user(@user_name, "unknown", :none)
    end
  end

  describe "Test statistics -" do
    @project_a "test_project_a"
    @project_b "test_project_b"
    @user_name "test_user"
    @user_password "test_password"
    @file_store_cache Application.compile_env(:field_hub, :file_info_cache_name)

    setup %{} do
      Project.create(@project_a)
      Project.create(@project_b)

      TestHelper.add_dummy_files_to_store(@project_a)

      User.create(@user_name, @user_password)
      Project.update_user(@user_name, @project_a, :member)
      Project.update_user(@user_name, @project_b, :member)

      on_exit(fn ->
        Project.delete(@project_a)
        Project.delete(@project_b)

        User.delete(@user_name)

        # We currently do not delete files when deleting a project
        # with Project.delete/1. For that reason we trigger
        # FileStore.remove_directories/1 additionally for cleanup.
        FileStore.remove_directories(@project_a)
        FileStore.remove_directories(@project_b)
        Cachex.del(@file_store_cache, @project)
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
               name: @project_a
             } = Project.evaluate_project(@project_a)
    end

    test "evaluate_all_projects_for_user/1 returns the expected values" do
      assert [
               %{
                 database: %{doc_count: 0, file_size: 33076},
                 files: %{
                   original_image: %{active: 2, active_size: 200_000, deleted: 1, deleted_size: 0},
                   thumbnail_image: %{active: 0, active_size: 0, deleted: 0, deleted_size: 0}
                 },
                 name: @project_a
               },
               %{
                 database: %{doc_count: 0, file_size: 33076},
                 files: %{
                   original_image: %{active: 0, active_size: 0, deleted: 0, deleted_size: 0},
                   thumbnail_image: %{active: 0, active_size: 0, deleted: 0, deleted_size: 0}
                 },
                 name: @project_b
               }
             ] = Project.evaluate_all_projects_for_user(@user_name)
    end
  end
end
