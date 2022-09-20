defmodule FieldHub.FileStoreTest do
  alias FieldHub.FileStore

  use ExUnit.Case, async: true

  @file_directory_root Application.get_env(:field_hub, :file_directory_root)
  @project "test-data"

  setup %{} do
    on_exit(fn ->
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

    FileStore.store_file("1234", @project, :original_image, content)
    assert File.exists?("#{@file_directory_root}/#{@project}/original_images/1234")
    assert not File.exists?("#{@file_directory_root}/#{@project}/original_images/1234.deleted")

    FileStore.delete("1234", @project)
    assert File.exists?("#{@file_directory_root}/#{@project}/original_images/1234")
    assert File.exists?("#{@file_directory_root}/#{@project}/original_images/1234.deleted")
  end

  test "file names containing '.' (besides tombstones) are not returned in file list" do
    FileStore.create_directories(@project)

    content = File.read!("test/fixtures/logo.png")

    File.write!("#{@file_directory_root}/#{@project}/original_images/validfilename", content)

    File.write!(
      "#{@file_directory_root}/#{@project}/original_images/anothervalidfilename",
      content
    )

    File.write!("#{@file_directory_root}/#{@project}/original_images/deleted_file", content)

    File.write!(
      "#{@file_directory_root}/#{@project}/original_images/deleted_file.deleted",
      content
    )

    File.write!(
      "#{@file_directory_root}/#{@project}/original_images/file_name_containg.dot",
      content
    )

    File.write!("#{@file_directory_root}/#{@project}/original_images/.hiddenfile", content)

    list = FileStore.get_file_list(@project)

    assert %{
             "anothervalidfilename" => %{deleted: false, types: [:original_image]},
             "deleted_file" => %{deleted: true, types: [:original_image]},
             "validfilename" => %{deleted: false, types: [:original_image]}
           } = list

    assert Enum.count(Map.keys(list)) == 3
  end

  test "subdirectories and their content are being ignored when generating file list" do
    FileStore.create_directories(@project)

    content = File.read!("test/fixtures/logo.png")

    File.write!("#{@file_directory_root}/#{@project}/original_images/validfilename", content)

    File.write!(
      "#{@file_directory_root}/#{@project}/original_images/anothervalidfilename",
      content
    )

    File.write!("#{@file_directory_root}/#{@project}/original_images/deleted_file", content)

    File.write!(
      "#{@file_directory_root}/#{@project}/original_images/deleted_file.deleted",
      content
    )

    File.mkdir!("#{@file_directory_root}/#{@project}/original_images/subdirectory")

    File.write!(
      "#{@file_directory_root}/#{@project}/original_images/subdirectory/empty_file",
      content
    )

    list = FileStore.get_file_list(@project)

    assert %{
             "anothervalidfilename" => %{deleted: false, types: [:original_image]},
             "deleted_file" => %{deleted: true, types: [:original_image]},
             "validfilename" => %{deleted: false, types: [:original_image]}
           } = list

    assert Enum.count(Map.keys(list)) == 3
  end

  test "File path to non-existent uuid or project returns :enoent posix" do
    assert {:error, :enoent} =
             FileStore.get_file_path("1234uuid", "project1234", :thumbnail_image)
  end

  test "File path to existing uuid or project returns complete file" do
    FileStore.create_directories(@project)

    content = File.read!("test/fixtures/logo.png")

    path = "#{@file_directory_root}/#{@project}/thumbnail_images/validfilename"

    File.write!(path, content)

    assert {:ok, ^path} = FileStore.get_file_path("validfilename", @project, :thumbnail_image)
  end
end
