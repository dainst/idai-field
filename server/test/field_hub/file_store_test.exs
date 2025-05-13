defmodule FieldHub.FileStoreTest do
  alias FieldHub.FileStore

  # use ExUnit.Case, async: true
  use ExUnit.Case

  @cache_name Application.compile_env(:field_hub, :file_index_cache_name)
  @root_directory Application.compile_env(:field_hub, :file_directory_root)
  @project "test-data"
  @project_directory "#{@root_directory}/#{@project}"
  @content File.read!("test/fixtures/logo.png")

  setup %{} do
    on_exit(fn ->
      # Run after each test
      Cachex.del(@cache_name, @project)
      File.rm_rf(@root_directory)
    end)
  end

  test "creates file directories for project" do
    FileStore.create_directories(@project)

    assert File.exists?("#{@project_directory}/original_images")
    assert File.exists?("#{@project_directory}/thumbnail_images")
  end

  test "file path to non-existent uuid or project returns :enoent posix" do
    assert {:error, :enoent} =
             FileStore.get_file_path("1234uuid", "project1234", :thumbnail_image)
  end

  describe "File operations -" do
    setup %{} do
      FileStore.create_directories(@project)
    end

    test "file can be stored" do
      assert :ok = FileStore.store("some_uuid", @project, :original_image, @content)

      size_file_store = File.stat!("#{@project_directory}/original_images/some_uuid").size

      assert byte_size(@content) == size_file_store
    end

    test "storing an existing file is `:ok` but does not overwrite the existing file" do
      assert :ok = FileStore.store("1234", @project, :original_image, @content)
      assert :ok = FileStore.store("1234", @project, :original_image, [])

      size_file_store = File.stat!("#{@project_directory}/original_images/1234").size

      assert byte_size(@content) == size_file_store
    end

    test "file deletion creates tombstone but leaves original file" do
      FileStore.store("1234", @project, :original_image, @content)
      assert File.exists?("#{@project_directory}/original_images/1234")
      assert not File.exists?("#{@project_directory}/original_images/1234.deleted")

      FileStore.discard("1234", @project)
      assert File.exists?("#{@project_directory}/original_images/1234")
      assert File.exists?("#{@project_directory}/original_images/1234.deleted")
    end

    test "file deletion results in index with all variants deleted" do
      FileStore.store("1234", @project, :original_image, @content)

      assert %{
               "1234" => %{
                 deleted: false,
                 types: [:original_image],
                 variants: [%{name: :original_image, size: 18619}]
               }
             } = FileStore.file_index(@project)

      FileStore.discard("1234", @project)

      assert %{
               "1234" => %{
                 deleted: true,
                 types: [:thumbnail_image, :original_image],
                 variants: [%{name: :thumbnail_image, size: 0}, %{name: :original_image, size: 0}]
               }
             } = FileStore.file_index(@project)
    end

    test "file names containing '.' (besides tombstones) are not returned in file list" do
      File.write!("#{@project_directory}/original_images/validfilename", @content)

      File.write!(
        "#{@project_directory}/original_images/anothervalidfilename",
        @content
      )

      File.write!("#{@project_directory}/original_images/deleted_file", @content)

      File.write!(
        "#{@project_directory}/original_images/deleted_file.deleted",
        @content
      )

      File.write!(
        "#{@project_directory}/original_images/file_name_containg.dot",
        @content
      )

      File.write!(
        "#{@project_directory}/original_images/new_file_being_written.writing",
        @content
      )

      File.write!("#{@project_directory}/original_images/.hiddenfile", @content)

      list = FileStore.file_index(@project)

      assert %{
               "anothervalidfilename" => %{deleted: false, types: [:original_image]},
               "deleted_file" => %{deleted: true, types: [:original_image]},
               "validfilename" => %{deleted: false, types: [:original_image]}
             } = list

      assert Enum.count(Map.keys(list)) == 3
    end

    test "without variant parameter return all files in file list" do
      File.write!("#{@project_directory}/thumbnail_images/uuid_1", @content)
      File.write!("#{@project_directory}/original_images/uuid_1", @content)
      File.write!("#{@project_directory}/original_images/uuid_2", @content)

      list = FileStore.file_index(@project)

      assert %{
               "uuid_1" => %{
                 deleted: false,
                 types: [:thumbnail_image, :original_image],
                 variants: [
                   %{name: :thumbnail_image},
                   %{name: :original_image}
                 ]
               },
               "uuid_2" => %{
                 deleted: false,
                 types: [:original_image],
                 variants: [%{name: :original_image}]
               }
             } = list
    end

    test "return files with specified variant in file list" do
      File.write!("#{@project_directory}/thumbnail_images/uuid_1", @content)
      File.write!("#{@project_directory}/original_images/uuid_1", @content)
      File.write!("#{@project_directory}/original_images/uuid_2", @content)
      File.write!("#{@project_directory}/thumbnail_images/uuid_3", @content)

      list = FileStore.file_index(@project, [:thumbnail_image])

      assert %{
               "uuid_1" => %{
                 deleted: false,
                 types: [:thumbnail_image],
                 variants: [
                   %{name: :thumbnail_image}
                 ]
               },
               "uuid_3" => %{
                 deleted: false,
                 types: [:thumbnail_image],
                 variants: [%{name: :thumbnail_image}]
               }
             } = list

      assert !Map.has_key?(list, "uuid_2")
    end

    test "subdirectories and their content are being ignored when generating file list" do
      File.write!("#{@project_directory}/original_images/validfilename", @content)

      File.write!(
        "#{@project_directory}/original_images/anothervalidfilename",
        @content
      )

      File.write!("#{@project_directory}/original_images/deleted_file", @content)

      File.write!(
        "#{@project_directory}/original_images/deleted_file.deleted",
        @content
      )

      File.mkdir!("#{@project_directory}/original_images/subdirectory")

      File.write!(
        "#{@project_directory}/original_images/subdirectory/empty_file",
        @content
      )

      list = FileStore.file_index(@project)

      assert %{
               "anothervalidfilename" => %{deleted: false, types: [:original_image]},
               "deleted_file" => %{deleted: true, types: [:original_image]},
               "validfilename" => %{deleted: false, types: [:original_image]}
             } = list

      assert Enum.count(Map.keys(list)) == 3
    end

    test "File path to existing uuid or project returns complete file" do
      path = "#{@project_directory}/thumbnail_images/validfilename"

      File.write!(path, @content)

      assert {:ok, ^path} = FileStore.get_file_path("validfilename", @project, :thumbnail_image)
    end

    test "file info gets cached by an initial request" do
      FileStore.store("some_uuid", @project, :original_image, @content)

      assert {:ok, nil} = Cachex.get(@cache_name, @project)
      assert %{"some_uuid" => %{}} = FileStore.file_index(@project)
      assert {:ok, %{"some_uuid" => %{}}} = Cachex.get(@cache_name, @project)
      # Somewhat hacky: In order to get 100% test coverage with `mix test --cover`
      # we call `FileStore.file_index/1` pnce with an existing file cache.
      assert %{"some_uuid" => %{}} = FileStore.file_index(@project)
    end

    test "file info cache gets cleared by file storing" do
      FileStore.store("validfilename", @project, :original_image, @content)

      assert {:ok, nil} = Cachex.get(@cache_name, @project)

      list = FileStore.file_index(@project)

      assert {
               :ok,
               %{
                 "validfilename" =>
                   %{
                     # irrelevant for test
                   }
               }
             } = Cachex.get(@cache_name, @project)

      assert {
               :ok,
               %{
                 "validfilename" =>
                   %{
                     # irrelevant for test
                   }
               }
             } = {:ok, list}

      FileStore.store("anothervalidfilename", @project, :original_image, @content)

      assert {:ok, nil} = Cachex.get(@cache_name, @project)
    end

    test "file info cache gets cleared by file deletion" do
      FileStore.store("validfilename", @project, :original_image, @content)

      assert {:ok, nil} = Cachex.get(@cache_name, @project)

      list = FileStore.file_index(@project)

      assert {
               :ok,
               %{
                 "validfilename" =>
                   %{
                     # irrelevant for test
                   }
               }
             } = Cachex.get(@cache_name, @project)

      assert {
               :ok,
               %{
                 "validfilename" =>
                   %{
                     # irrelevant for test
                   }
               }
             } = {:ok, list}

      FileStore.discard("validfilename", @project)

      assert {:ok, nil} = Cachex.get(@cache_name, @project)
    end

    test "file info cache gets cleared after project directory is deleted" do
      FileStore.store("validfilename", @project, :original_image, @content)

      assert {:ok, nil} = Cachex.get(@cache_name, @project)

      list = FileStore.file_index(@project)

      assert {
               :ok,
               %{
                 "validfilename" =>
                   %{
                     # irrelevant for test
                   }
               }
             } = Cachex.get(@cache_name, @project)

      assert {
               :ok,
               %{
                 "validfilename" =>
                   %{
                     # irrelevant for test
                   }
               }
             } = {:ok, list}

      FileStore.remove_directories(@project)

      assert {:ok, nil} = Cachex.get(@cache_name, @project)
    end
  end
end
