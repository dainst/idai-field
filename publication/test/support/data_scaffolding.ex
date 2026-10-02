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

  def create_core_database(context) do
    CouchService.put_database(@core_database)

    on_exit(fn ->
      CouchService.delete_database(@core_database)
    end)

    context
  end

  def add_editor_user(context) do
    password = "pw"

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
    password = "pw"

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

  def add_projects_and_empty_publications(%{editor: editor} = context) do
    {:ok, project_a} =
      Project.put(%Project{
        identifier: "test_project_a",
        editors: [editor.name]
      })

    {:ok, project_b} =
      Project.put(%Project{
        identifier: "test_project_b"
      })

    {:ok, published_project_a} =
      Publication.create_from_replication_input(%ReplicationInput{
        delete_existing_publication: true,
        source_url: "http://example.org",
        source_project_identifier: project_a.identifier,
        source_user: "remote_field_field_hub_user",
        source_password: "fake",
        project_identifier: project_a.identifier,
        drafted_by: "mix seed",
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
        drafted_by: "mix seed",
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
        drafted_by: "mix seed",
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

    on_exit(fn ->
      Project.delete(project_a)
      Project.delete(project_b)
    end)

    context
    |> Map.put(:project_a, project_a)
    |> Map.put(:project_b, project_b)
    |> Map.put(:published_project_a, published_project_a)
    |> Map.put(:unpublished_project_a, unpublished_project_a)
    |> Map.put(:unpublished_project_b, unpublished_project_b)
  end
end
