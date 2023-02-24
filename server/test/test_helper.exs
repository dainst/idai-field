ExUnit.start()

alias FieldHub.{
  CouchService,
  FileStore,
  Issues.Issue,
  Project,
  User
}

defmodule FieldHub.TestHelper do
  def create_test_db_and_user(project_identifier, user_name, user_password) do
    Project.create(project_identifier)
    User.create(user_name, user_password)
    Project.update_user(user_name, project_identifier, :member)
  end

  def remove_test_db_and_user(project_identifier, user_name) do
    remove_project(project_identifier)
    User.delete(user_name)
  end

  def remove_project(project_identifier) do
    Project.delete(project_identifier)
    # Currently the Project is not deleting file directories.
    FileStore.remove_directories(project_identifier)
  end

  def create_user(user_name, user_password) do
    User.create(user_name, user_password)
  end

  def remove_user(user_name) do
    User.delete(user_name)
  end

  def add_dummy_files_to_store(project_identifier) do
    FileStore.store(
      "file_a",
      project_identifier,
      :original_image,
      String.duplicate("0123456789", 10_000)
    )

    FileStore.store(
      "file_b",
      project_identifier,
      :original_image,
      String.duplicate("0123456789", 10_000)
    )

    FileStore.store(
      "file_c",
      project_identifier,
      :original_image,
      String.duplicate("0123456789", 10_000)
    )

    FileStore.discard("file_c", project_identifier)
  end

  def create_complete_example_project(project_identifier, user_name, user_password) do
    create_test_db_and_user(project_identifier, user_name, user_password)

    fixtures_directory = "test/fixtures/complete_project"

    File.ls!("#{fixtures_directory}/file_store")
    |> Enum.map(fn variant_directory ->
      File.ls!("#{fixtures_directory}/file_store/#{variant_directory}")
      |> Enum.each(fn file ->
        File.cp!(
          "#{fixtures_directory}/file_store/#{variant_directory}/#{file}",
          "#{Application.get_env(:field_hub, :file_directory_root)}/#{project_identifier}/#{variant_directory}/#{file}"
        )
      end)
    end)

    docs =
      "#{fixtures_directory}/project_export.jsonl"
      |> File.read!()
      |> String.split("\n")
      |> Enum.reject(fn value ->
        value == ""
      end)
      |> case do
        # Remove `_rev` entries in order to be able to import into a new database.
        [_metadata, docs, _seq] ->
          Jason.decode!(docs)
          |> Map.get("docs")
          |> Enum.map(fn doc ->
            doc
            |> Map.delete("_rev")
            |> Map.delete("_revisions")
          end)
      end

    payload =
      %{docs: docs}
      |> Jason.encode!()

    "#{CouchService.base_url()}/#{project_identifier}/_bulk_docs"
    |> HTTPoison.post!(
      payload,
      headers()
    )
  end

  def remove_complete_example_project(project_identifier, user_name) do
    remove_test_db_and_user(project_identifier, user_name)
    FileStore.remove_directories(project_identifier)
  end

  def database_exists?(project_identifier) do
    "#{CouchService.base_url()}/#{project_identifier}"
    |> HTTPoison.get!(headers())
  end

  def get_admin_basic_auth() do
    encoded =
      "#{Application.get_env(:field_hub, :couchdb_admin_name)}:#{Application.get_env(:field_hub, :couchdb_admin_password)}"
      |> Base.encode64()

    "Basic #{encoded}"
  end

  def create_document(project_identifier, doc) do
    "#{CouchService.base_url()}/#{project_identifier}"
    |> HTTPoison.post!(
      Jason.encode!(doc),
      headers()
    )
  end

  def update_document(project_identifier, %{"_id" => id} = doc) do
    rev = get_current_revision(project_identifier, id)

    "#{CouchService.base_url()}/#{project_identifier}/#{id}?rev=#{rev}"
    |> HTTPoison.put(
      Jason.encode!(doc),
      headers()
    )
  end

  def delete_document(project_identifier, id) do
    rev = get_current_revision(project_identifier, id)

    "#{CouchService.base_url()}/#{project_identifier}/#{id}?rev=#{rev}"
    |> HTTPoison.delete(headers())
  end

  def get_current_revision(project_identifier, id) do
    "#{CouchService.base_url()}/#{project_identifier}/#{id}"
    |> HTTPoison.get!(headers())
    |> case do
      %{body: body} ->
        body
        |> Jason.decode!()
        |> Map.get("_rev")
    end
  end

  def clear_authentication_token_cache() do
    Cachex.clear!(Application.get_env(:field_hub, :user_tokens_cache_name))
  end

  @doc """
  Should always return an example for each possible issue evaluated by `FieldHub.Issues`.
  """
  def get_example_issues() do
    image_metadata = %{
      uuid: "some_uuid",
      file_type: "Drawing",
      file_name: "drawing.png",
      created_by: "Simon Hohl",
      created: "2023-01-03T10:30:00.000Z"
    }

    [
      %Issue{type: :no_project_document, severity: :error, data: %{}},
      %Issue{type: :no_default_project_map_layer, severity: :info, data: %{}},
      %Issue{
        type: :file_directory_not_found,
        severity: :error,
        data: %{path: "/some/file/path"}
      },
      %Issue{
        type: :missing_original_image,
        severity: :info,
        data: image_metadata
      },
      %Issue{
        type: :image_variants_size,
        severity: :warning,
        data:
          Map.merge(
            image_metadata,
            %{original_size: 100, thumbnail_size: 100}
          )
      },
      %Issue{
        data: %{
          documents: [
            %{
              "_id" => "st1",
              "resource" => %{"id" => "st1", "identifier" => "PQ1-ST1"}
            },
            %{
              "_id" => "st1-duplicate",
              "resource" => %{"id" => "st1-duplicate", "identifier" => "PQ1-ST1"}
            }
          ],
          identifier: "PQ1-ST1"
        },
        severity: :error,
        type: :non_unique_identifiers
      },
      %Issue{
        type: :unresolved_relation,
        severity: :error,
        data: %{
          unresolved: ["sa1"],
          doc: %{"_id" => "syu2", "resource" => %{"some" => "content"}}
        }
      },
      %Issue{
        type: :unexpected_error,
        severity: :error,
        data: %{stack_trace: %{"some" => "error"}}
      }
    ]
  end

  defp headers() do
    [
      {"Content-Type", "application/json"},
      {"Authorization", get_admin_basic_auth()}
    ]
  end
end
