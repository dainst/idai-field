ExUnit.start()

alias FieldHub.{
  CLI,
  FileStore,
  CouchService
}

defmodule FieldHub.TestHelper do
  def create_test_db_and_user(project, user_name, user_password) do
    CLI.create_project(project)
    CLI.create_user(user_name, user_password)
    CLI.add_user_as_project_member(user_name, project)
    CLI.add_user_as_project_member(Application.get_env(:field_hub, :couchdb_user_name), project)
  end

  def remove_test_db_and_user(project, user_name) do
    remove_project(project)
    CLI.delete_user(user_name)
  end

  def remove_project(project) do
    CLI.delete_project(project)
    # Currently the CLI is not deleting file directories.
    FileStore.remove_directories(project)
  end

  def add_test_files_to_store(project) do
    FileStore.store_file(
      "file_a",
      project,
      :original_image,
      String.duplicate("0123456789", 10_000)
    )

    FileStore.store_file(
      "file_b",
      project,
      :original_image,
      String.duplicate("0123456789", 10_000)
    )

    FileStore.store_file(
      "file_c",
      project,
      :original_image,
      String.duplicate("0123456789", 10_000)
    )

    FileStore.delete("file_c", project)
  end

  def create_complete_example_project(project_name, user_name, user_password) do
    create_test_db_and_user(project_name, user_name, user_password)

    fixtures_directory = "test/fixtures/complete_project"

    File.ls!("#{fixtures_directory}/file_store")
    |> Enum.map(fn variant_directory ->
      File.ls!("#{fixtures_directory}/file_store/#{variant_directory}")
      |> Enum.each(fn file ->
        File.cp!(
          "#{fixtures_directory}/file_store/#{variant_directory}/#{file}",
          "#{Application.get_env(:field_hub, :file_directory_root)}/#{project_name}/#{variant_directory}/#{file}"
        )
      end)
    end)

    encoded_credentials =
      "#{Application.get_env(:field_hub, :couchdb_admin_name)}:#{Application.get_env(:field_hub, :couchdb_admin_password)}"
      |> Base.encode64()

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
          end)
      end

    payload =
      %{docs: docs}
      |> Jason.encode!()

    "#{CouchService.base_url()}/#{project_name}/_bulk_docs"
    |> HTTPoison.post!(
      payload,
      [
        {"Content-Type", "application/json"},
        {"Authorization", "Basic #{encoded_credentials}"}
      ]
    )
  end

  def remove_complete_example_project(project_name, user_name) do
    remove_test_db_and_user(project_name, user_name)
    FileStore.remove_directories(project_name)
  end
end
