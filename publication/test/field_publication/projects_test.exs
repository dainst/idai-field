defmodule FieldPublication.ProjectTest do
  use ExUnit.Case

  alias FieldPublication.FileService
  alias FieldPublication.CouchService
  alias FieldPublication.DatabaseSchema.Project
  alias FieldPublication.Projects

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
      {:ok, %Project{_rev: rev}} = Projects.put(%Project{}, @project_fixture)

      assert is_binary(rev)
    end

    # test "can update project" do
    #   {:ok, %Project{_rev: rev, hidden: true} = initial} =
    #     Projects.put(%Project{}, @project_fixture)

    #   {:ok, %Project{_rev: rev_updated}} =
    #     Projects.put(initial, %{"hidden" => false})

    #   assert rev != rev_updated
    # end

    test "trying to update/override a project without rev results in error" do
      assert {:ok, %Project{}} = Projects.put(%Project{}, @project_fixture)
      assert {:error, changeset} = Projects.put(%Project{}, @project_fixture)

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

      Projects.put(%Project{}, @project_fixture)

      {:ok, second_project} =
        Projects.put(%Project{}, Map.put(@project_fixture, "identifier", second_identifier))

      [%Project{identifier: ^first_identifier}, %Project{identifier: ^second_identifier}] =
        Projects.list()

      # Cleanup after test.
      on_exit(fn ->
        Projects.delete(second_project)
      end)
    end

    test "can get/1 by identifier" do
      Projects.put(%Project{}, @project_fixture)
      assert {:ok, %Project{}} = Projects.get(@project_fixture["identifier"])
    end

    test "get/1 for unknown project returns error" do
      assert {:error, :not_found} = Projects.get(@project_fixture["identifier"])
    end

    test "can get!/1 by identifier" do
      Projects.put(%Project{}, @project_fixture)
      assert %Project{} = Projects.get!(@project_fixture["identifier"])
    end
  end
end
