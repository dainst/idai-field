ExUnit.start()

alias FieldHub.{
  Project,
  User,
  FileStore,
  CouchService
}

defmodule FieldHub.TestHelper do
  def create_test_db_and_user(project_name, user_name, user_password) do
    Project.create(project_name)
    User.create(user_name, user_password)
    Project.update_user(user_name, project_name, :member)
  end

  def remove_test_db_and_user(project_name, user_name) do
    remove_project(project_name)
    User.delete(user_name)
  end

  def remove_project(project_name) do
    Project.delete(project_name)
    # Currently the Project is not deleting file directories.
    FileStore.remove_directories(project_name)
  end

  def remove_user(user_name) do
    User.delete(user_name)
  end

  def add_dummy_files_to_store(project_name) do
    FileStore.store_file(
      "file_a",
      project_name,
      :original_image,
      String.duplicate("0123456789", 10_000)
    )

    FileStore.store_file(
      "file_b",
      project_name,
      :original_image,
      String.duplicate("0123456789", 10_000)
    )

    FileStore.store_file(
      "file_c",
      project_name,
      :original_image,
      String.duplicate("0123456789", 10_000)
    )

    FileStore.delete("file_c", project_name)
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
      headers()
    )
  end

  def remove_complete_example_project(project_name, user_name) do
    remove_test_db_and_user(project_name, user_name)
    FileStore.remove_directories(project_name)
  end

  def database_exists?(project_name) do
    "#{CouchService.base_url()}/#{project_name}"
    |> HTTPoison.get!(headers())
  end

  defp headers() do
    encoded_credentials =
      "#{Application.get_env(:field_hub, :couchdb_admin_name)}:#{Application.get_env(:field_hub, :couchdb_admin_password)}"
      |> Base.encode64()

    [
      {"Content-Type", "application/json"},
      {"Authorization", "Basic #{encoded_credentials}"}
    ]
  end
end
