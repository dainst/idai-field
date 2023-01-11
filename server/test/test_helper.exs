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

  def create_user(user_name, user_password) do
    User.create(user_name, user_password)
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
            |> Map.delete("_revisions")
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

  def get_admin_basic_auth() do
    encoded =
      "#{Application.get_env(:field_hub, :couchdb_admin_name)}:#{Application.get_env(:field_hub, :couchdb_admin_password)}"
      |> Base.encode64()

    "Basic #{encoded}"
  end

  def create_document(project_name, doc) do
    "#{CouchService.base_url()}/#{project_name}"
    |> HTTPoison.post!(
      doc,
      headers()
    )
  end

  def update_document(project_name, %{"_id" => id} = doc) do
    rev = get_current_revision(project_name, id)

    "#{CouchService.base_url()}/#{project_name}/#{id}?rev=#{rev}"
    |> HTTPoison.put(
      Jason.encode!(doc),
      headers()
    )
  end

  def delete_document(project_name, id) do
    rev = get_current_revision(project_name, id)

    "#{CouchService.base_url()}/#{project_name}/#{id}?rev=#{rev}"
    |> HTTPoison.delete(headers())
  end

  def get_current_revision(project_name, id) do
    "#{CouchService.base_url()}/#{project_name}/#{id}"
    |> HTTPoison.get!(headers())
    |> case do
      %{body: body} ->
        body
        |> Jason.decode!()
        |> Map.get("_rev")
    end
  end

  defp headers() do
    [
      {"Content-Type", "application/json"},
      {"Authorization", get_admin_basic_auth()}
    ]
  end
end
