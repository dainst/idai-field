defmodule FieldHub.FileStoreTest do
  alias FieldHub.FileStore

  use ExUnit.Case, async: true

  @file_directory_root Application.get_env(:field_hub, :file_directory_root)

  setup %{} do
    on_exit(fn() ->
      File.rm_rf(@file_directory_root)
    end)
  end

  test "creates file directories for project" do
    FileStore.create_directories("test-data")

    assert File.exists?("#{@file_directory_root}/test-data/original_images")
    assert File.exists?("#{@file_directory_root}/test-data/thumbnail_images")
  end

end
