defmodule FieldPublication.ProjectTest do
  use ExUnit.Case

  alias FieldPublication.{
    CouchService,
    FileService,
    Project
  }

  @core_database Application.compile_env(:field_publication, :core_database)
  @project_fixture %{"identifier" => "test"}

  setup do
    CouchService.put_database(@core_database)

    on_exit(fn ->
      CouchService.delete_database(@core_database)
      FileService.delete(@project_fixture["identifier"])
    end)

    :ok
  end

  describe "projects" do
    test "can create a new project" do
      {:ok, %Project{_rev: rev}} = Project.put(%Project{}, @project_fixture)

      assert is_binary(rev)
    end

    test "trying to update/override a project without rev results in error" do
      assert {:ok, %Project{}} = Project.put(%Project{}, @project_fixture)
      assert {:error, changeset} = Project.put(%Project{}, @project_fixture)

      assert %{
               errors: [
                 identifier: {
                   "a project with this identifier already exists, the provided document revision does not match the existing",
                   _
                 }
               ]
             } = changeset
    end

    test "can list projects" do
      first_identifier = @project_fixture["identifier"]
      second_identifier = "test2"

      Project.put(%Project{}, @project_fixture)

      {:ok, second_project} =
        Project.put(%Project{}, Map.put(@project_fixture, "identifier", second_identifier))

      [%Project{identifier: ^first_identifier}, %Project{identifier: ^second_identifier}] =
        Project.list()

      # Cleanup after test.
      on_exit(fn ->
        Project.delete(second_project)
      end)
    end

    test "can get/1 by identifier" do
      Project.put(%Project{}, @project_fixture)
      assert {:ok, %Project{}} = Project.get(@project_fixture["identifier"])
    end

    test "get/1 for unknown project returns error" do
      assert {:error, :not_found} = Project.get(@project_fixture["identifier"])
    end

    test "can get!/1 by identifier" do
      Project.put(%Project{}, @project_fixture)
      assert %Project{} = Project.get!(@project_fixture["identifier"])
    end
  end
end
