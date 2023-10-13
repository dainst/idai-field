defmodule FieldPublication.ProjectTest do
  use ExUnit.Case

  alias FieldPublication.CouchService
  alias FieldPublication.Schemas.Project
  alias FieldPublication.Projects

  @core_database Application.compile_env(:field_publication, :core_database)
  @project_fixture %{"name" => "test"}

  setup do
    CouchService.create_database(@core_database)

    on_exit(fn ->
      CouchService.delete_database(@core_database)
    end)

    :ok
  end

  describe "projects" do
    test "can create a new project" do
      {:ok, %Project{_rev: rev}} = Projects.put(%Project{}, @project_fixture)

      assert is_binary(rev)
    end

    test "can update project" do
      {:ok, %Project{_rev: rev, hidden: true} = initial} =
        Projects.put(%Project{}, @project_fixture)

      {:ok, %Project{_rev: rev_updated, hidden: false}} =
        Projects.put(initial, %{"hidden" => false})

      assert rev != rev_updated
    end

    test "trying to update/override a project without rev results in error" do
      {:ok, %Project{}} = Projects.put(%Project{}, @project_fixture)
      {:error, changeset} = Projects.put(%Project{}, @project_fixture)

      assert %{errors: [duplicate_document: {_msg, _}]} = changeset
    end

    test "can list projects" do
      first_name = Map.get(@project_fixture, "name")
      second_name = "test2"

      Projects.put(%Project{}, @project_fixture)
      Projects.put(%Project{}, Map.put(@project_fixture, "name", second_name))

      [%Project{name: ^first_name}, %Project{name: ^second_name}] = Projects.list()
    end

    test "can get/1 by name" do
      Projects.put(%Project{}, @project_fixture)
      assert {:ok, %Project{}} = Projects.get(Map.get(@project_fixture, "name"))
    end

    test "get/1 for unknown project returns error" do
      assert {:error, :not_found} = Projects.get(Map.get(@project_fixture, "name"))
    end

    test "can get!/1 by name" do
      Projects.put(%Project{}, @project_fixture)
      assert %Project{} = Projects.get!(Map.get(@project_fixture, "name"))
    end
  end
end
