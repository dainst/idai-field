defmodule FieldHub.FileStoreTest do
  alias FieldHub.FileStore

  use ExUnit.Case, async: true

  @file_directory_root Application.get_env(:field_hub, :file_directory_root)
  @project "test-data"

  setup %{} do
    on_exit(fn() ->
      # Run after each test
      File.rm_rf(@file_directory_root)
    end)
  end

  test "creates file directories for project" do
    FileStore.create_directories(@project)

    assert File.exists?("#{@file_directory_root}/#{@project}/original_images")
    assert File.exists?("#{@file_directory_root}/#{@project}/thumbnail_images")
  end

  test "file deletion creates tombstone but leaves original file" do

    FileStore.create_directories(@project)

    content = File.read!("test/fixtures/logo.png")

    FileStore.store_file(%{uuid: "1234", project: @project, type: :original_image, content: content})
    assert File.exists?("#{@file_directory_root}/#{@project}/original_images/1234")
    assert not File.exists?("#{@file_directory_root}/#{@project}/original_images/1234.deleted")

    FileStore.delete(%{uuid: "1234", project: @project})
    assert File.exists?("#{@file_directory_root}/#{@project}/original_images/1234")
    assert File.exists?("#{@file_directory_root}/#{@project}/original_images/1234.deleted")
  end
end
