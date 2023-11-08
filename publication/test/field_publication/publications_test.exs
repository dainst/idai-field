defmodule FieldPublication.PublicationsTest do
  use ExUnit.Case

  alias FieldPublication.CouchService
  alias FieldPublication.Projects
  alias FieldPublication.Publications

  alias FieldPublication.Schemas.{
    Project,
    Publication,
    ReplicationInput
  }

  @core_database Application.compile_env(:field_publication, :core_database)
  @local_project_name "local_test"

  @publication_params_fixture %{
    project_name: @local_project_name,
    source_url: "http://example.com",
    source_project_name: "source_test",
    draft_date: "2023-09-28",
    configuration_doc: "configuration_#{@local_project_name}_2023-09-28",
    database: "publication_#{@local_project_name}_2023-09-28"
  }

  setup do
    CouchService.put_database(@core_database)
    {:ok, project} = Projects.put(%Project{}, %{"name" => @local_project_name})

    on_exit(fn ->
      CouchService.delete_database(@core_database)
      CouchService.delete_database(@publication_params_fixture.database)
      Projects.delete(project)
    end)

    :ok
  end

  describe "publications" do
    test "can put a new publication" do
      {:ok, %Publication{}} = Publications.put(%Publication{}, @publication_params_fixture)
    end

    test "can update publication" do
      {:ok, %Publication{_rev: rev, publication_date: nil, draft_date: draft_date} = initial} =
        Publications.put(%Publication{}, @publication_params_fixture)

      {:ok, %Publication{_rev: rev_updated, publication_date: publication_date}} =
        Publications.put(initial, %{publication_date: Date.add(draft_date, 7)})

      assert rev != rev_updated
      assert ^publication_date = Date.add(draft_date, 7)
    end

    test "trying to update/override a publication without rev results in error" do
      {:ok, %Publication{}} = Publications.put(%Publication{}, @publication_params_fixture)
      {:error, changeset} = Publications.put(%Publication{}, @publication_params_fixture)

      assert %{errors: [database_exists: {_msg, _}]} = changeset
    end

    test "can delete publication" do
      {:ok, publication} = Publications.put(%Publication{}, @publication_params_fixture)
      {:ok, :deleted} = Publications.delete(publication)
    end

    test "can not put without existing project" do
      Projects.get!(@local_project_name)
      |> Projects.delete()

      {:error, changeset} = Publications.put(%Publication{}, @publication_params_fixture)

      assert %Ecto.Changeset{errors: [project_name: {_msg, _}]} = changeset
    end

    test "can list publications" do
      assert [] = Publications.list()

      Publications.put(%Publication{}, @publication_params_fixture)

      assert [%Publication{project_name: @local_project_name}] =
               Publications.list()
    end

    test "can list publications for specific project" do
      other_project_name = "other_name"
      other_project_database_name = "publication_#{other_project_name}_2023-09-28"

      other_project_params =
        @publication_params_fixture
        |> Map.put(:project_name, other_project_name)
        |> Map.put(:configuration_doc, "configuration_#{other_project_name}_2023-09-28")
        |> Map.put(:database, other_project_database_name)

      {:ok, other_project} = Projects.put(%Project{}, %{"name" => other_project_name})

      Publications.put(%Publication{}, @publication_params_fixture)
      Publications.put(%Publication{}, other_project_params)

      assert [
               %Publication{project_name: @local_project_name},
               %Publication{project_name: ^other_project_name}
             ] = Publications.list()

      assert [
               %Publication{project_name: ^other_project_name}
             ] = Publications.list(other_project)

      CouchService.delete_database(other_project_database_name)

      # Cleanup after test.
      on_exit(fn ->
        Projects.delete(other_project)
      end)
    end
  end

  test "can create from replication input" do
    assert {:ok, publication} =
             Publications.create_from_replication_input(%ReplicationInput{
               source_url: "http://example.com",
               source_project_name: "source_test",
               project_name: @local_project_name,
               comments: [],
               delete_existing_publication: false
             })

    CouchService.delete_database(publication.database)
  end
end
