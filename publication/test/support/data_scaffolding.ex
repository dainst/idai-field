defmodule FieldPublication.Test.DataScaffolding do
  import ExUnit.Callbacks

  alias FieldPublication.{
    CouchService,
    Replication.ReplicationInput,
    Project,
    Publication,
    User
  }

  # alias FieldPublication.Test.ProjectSeed

  @core_database Application.compile_env(:field_publication, :core_database)
  @couch_admin_name Application.compile_env(:field_publication, :couchdb_admin_name)

  def create_core_database(context) do
    CouchService.put_database(@core_database)

    on_exit(fn ->
      CouchService.delete_database(@core_database)
    end)

    context
  end

  def add_editor_user(context) do
    password = "1234567890asdfgh"

    {:ok, user} =
      User.create(%{
        name: "test_editor",
        password: password,
        label: "Test Editor",
        email: "test_editor@example.org"
      })

    on_exit(fn ->
      User.delete(user)
    end)

    # User.create will not return with a set password, but we want to provide it for the tests.
    user = Map.put(user, :password, password)

    Map.put(context, :editor, user)
  end

  def add_admin_user(context) do
    password = "1234567890qwertz"

    {:ok, user} =
      User.create(%{
        name: "test_admin",
        password: password,
        label: "Test Admin",
        email: "test_admin@example.org",
        admin?: true
      })

    on_exit(fn ->
      User.delete(user)
    end)

    # User.create will not return with a set password, but we want to provide it for the tests.
    user = Map.put(user, :password, password)

    Map.put(context, :administrator, user)
  end

  def add_projects(%{editor: editor} = context) do
    {project_a, project_b, project_c} = projects_setup(editor)

    on_exit(fn ->
      projects_exit([project_a, project_b, project_c])
    end)

    context
    |> Map.put(:project_a, project_a)
    |> Map.put(:project_b, project_b)
    |> Map.put(:project_c, project_c)
  end

  def add_projects_and_empty_publications(%{editor: editor} = context) do
    {project_a, project_b, project_c} = projects_setup(editor)

    {published_project_a, unpublished_project_a, unpublished_project_b} =
      publications_setup(project_a, project_b)

    on_exit(fn ->
      projects_exit([project_a, project_b, project_c])
    end)

    context
    |> Map.put(:project_a, project_a)
    |> Map.put(:project_b, project_b)
    |> Map.put(:project_c, project_c)
    |> Map.put(:published_project_a, published_project_a)
    |> Map.put(:unpublished_project_a, unpublished_project_a)
    |> Map.put(:unpublished_project_b, unpublished_project_b)
  end

  def add_projects_and_publications(%{editor: editor} = context) do
    {project_a, project_b, project_c} = projects_setup(editor)

    {published_project_a, unpublished_project_a, unpublished_project_b} =
      publications_setup(project_a, project_b)

    FieldPublication.Test.ProjectSeed.put_data(published_project_a)

    on_exit(fn ->
      projects_exit([project_a, project_b, project_c])
    end)

    context
    |> Map.put(:project_a, project_a)
    |> Map.put(:project_b, project_b)
    |> Map.put(:project_c, project_c)
    |> Map.put(:published_project_a, published_project_a)
    |> Map.put(:unpublished_project_a, unpublished_project_a)
    |> Map.put(:unpublished_project_b, unpublished_project_b)
  end

  def pick_map_layer_image(%{published_project_a: %Publication{} = publication} = context) do
    image_doc =
      Publication.get_raw_document("project", publication)
      |> Map.get("resource", %{})
      |> Map.get("relations", %{})
      |> Map.get("hasMapLayer", [])
      |> List.first()
      |> Publication.get_raw_document(publication)

    Map.put(context, :image_doc, image_doc)
  end

  defp projects_setup(editor) do
    {:ok, project_a} =
      Project.put(%Project{
        identifier: "test_project_a",
        editors: [editor.name]
      })

    {:ok, project_b} =
      Project.put(%Project{
        identifier: "test_project_b"
      })

    {:ok, project_c} =
      Project.put(%Project{
        identifier: "test_project_c"
      })

    {project_a, project_b, project_c}
  end

  defp projects_exit(projects) do
    Enum.each(projects, fn project -> Project.delete(project) end)
  end

  def publications_setup(project_a, project_b) do
    {:ok, published_project_a} =
      Publication.create_from_replication_input(%ReplicationInput{
        delete_existing_publication: true,
        source_url: "http://example.org",
        source_project_identifier: project_a.identifier,
        source_user: "remote_field_field_hub_user",
        source_password: "fake",
        project_identifier: project_a.identifier,
        drafted_by: @couch_admin_name,
        draft_date: Date.from_iso8601!("2026-09-28")
      })

    {:ok, published_project_a} =
      Publication.put(published_project_a, %{
        publication_date: Date.from_iso8601!("2026-09-28"),
        project_label: [
          %{
            language: "de",
            text: "Projekt A"
          },
          %{
            language: "en",
            text: "Project A"
          }
        ],
        project_description: [
          %{
            language: "de",
            text: "Dies ist die Projektbeschreibung."
          },
          %{
            language: "en",
            text: "This is the project description."
          }
        ],
        publication_description: [
          %{
            language: "en",
            text: "This is a publication created by the test scaffolding."
          }
        ]
      })

    {:ok, unpublished_project_a} =
      Publication.create_from_replication_input(%ReplicationInput{
        delete_existing_publication: true,
        source_url: "http://example.org",
        source_project_identifier: project_a.identifier,
        source_user: "remote_field_field_hub_user",
        source_password: "fake",
        project_identifier: project_a.identifier,
        drafted_by: @couch_admin_name,
        draft_date: Date.from_iso8601!("2026-09-29")
      })

    {:ok, unpublished_project_a} =
      Publication.put(unpublished_project_a, %{
        project_label: [
          %{
            language: "de",
            text: "Projekt A, Fortgesetzt"
          },
          %{
            language: "en",
            text: "Project A, Continued"
          }
        ],
        project_description: [
          %{
            language: "de",
            text: "Dies ist die Projektbeschreibung."
          },
          %{
            language: "en",
            text: "This is the project description."
          }
        ]
      })

    {:ok, unpublished_project_b} =
      Publication.create_from_replication_input(%ReplicationInput{
        delete_existing_publication: true,
        source_url: "http://example.org",
        source_project_identifier: project_b.identifier,
        source_user: "remote_field_field_hub_user",
        source_password: "fake",
        project_identifier: project_b.identifier,
        drafted_by: @couch_admin_name,
        draft_date: Date.from_iso8601!("2026-09-29")
      })

    {:ok, unpublished_project_b} =
      Publication.put(unpublished_project_b, %{
        project_label: [
          %{
            language: "de",
            text: "Projekt B"
          },
          %{
            language: "en",
            text: "Project B"
          }
        ],
        project_description: [
          %{
            language: "de",
            text: "Dies ist die Projektbeschreibung."
          },
          %{
            language: "en",
            text: "This is the project description."
          }
        ]
      })

    {published_project_a, unpublished_project_a, unpublished_project_b}
  end
end
