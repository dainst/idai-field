defmodule FieldHub.FileStore do
  @file_directory_root Application.compile_env(:field_hub, :file_directory_root)
  @tombstone_suffix ".deleted"
  @valid_file_variants Application.compile_env(:field_hub, :valid_file_variants)
  @index_cache_name Application.compile_env(:field_hub, :file_index_cache_name)
  @index_cache_expiration_ms 1000 * 60 * 60 * 24
  # @index_cache_expiration_ms 3000

  require Logger

  @moduledoc """
  Bundles functions to facilitate the storing, discarding and indexing of files in file system for the different projects.

  For each project the file index gets cached in memory for #{@index_cache_expiration_ms} ms
  or until a file gets stored or discarded.

  To extent the list of valid file variants (currently `#{inspect(@valid_file_variants)}`), it should suffice to add an additonal
  `get_variant_directory/2` function here, an additional `parse_type/1` in FieldHubWeb.Api.FileController and update the list in config.exs.
  """

  @doc """
  Create directories for a project.

  Returns a map with keys `#{inspect(@valid_file_variants)}` and values `:ok` or `{:error, posix}` each.

  __Parameters__
  - `project_identifier` the project's name.
  """
  def create_directories(project_identifier) do
    @valid_file_variants
    |> Enum.map(fn type ->
      get_variant_directory(project_identifier, type)
      |> File.mkdir_p()
    end)
    |> Enum.zip(@valid_file_variants)
    |> Enum.into(%{}, fn {status, variant_name} ->
      {variant_name, status}
    end)
  end

  @doc """
  Remove all file directories for a project, not reversable.

  __Parameters__
  - `project_identifier` the project's name.

  Returns `{:ok, files_and_directories}` with all files and directories removed in no specific order, `{:error, posix, file}` otherwise.

  """
  def remove_directories(project_identifier) do
    clear_cache(project_identifier)

    project_identifier
    |> get_project_directory()
    |> File.rm_rf()
  end

  @doc """
  Get a map containing file information for a project. If no specific variants are requested
  all files are returned.

  __Parameters__
  - `project_identifier` the project's name.
  - `requested_variants` (optional) list of requested variants, valid values: `#{inspect(@valid_file_variants)}`

  Returns a map that, once encoded as JSON, will pass the validation against the 'files-list.json' JSON schema used by all Field applications.

  ## Example

      iex> FileStore.file_index("development", [:original_images])
      %{
        "file_uuid" => %{
          deleted: false,
          types: [:original_image],
          variants: [
            %{name: :original_image, size: 275447}
          ]
        }
      }

  """
  def file_index(project_identifier, requested_variants \\ @valid_file_variants) do
    case Cachex.get(@index_cache_name, project_identifier) do
      {:ok, nil} ->
        new_file_index = create_file_index(project_identifier)

        Cachex.put!(@index_cache_name, project_identifier, new_file_index,
          ttl: @index_cache_expiration_ms
        )

        new_file_index

      {:ok, cached_file_index} ->
        cached_file_index
    end
    |> Map.filter(fn {_uuid, %{variants: cached_variants}} ->
      # Only keep files that match one of the requested variants
      cached_variants
      |> Stream.map(fn %{name: name} ->
        name
      end)
      |> Enum.any?(fn cached_variant ->
        Enum.member?(requested_variants, cached_variant)
      end)
    end)
    |> Map.new(fn {uuid, info} ->
      {
        uuid,
        info
        # TODO:
        |> Map.update!(:types, fn old_values ->
          #
          Enum.filter(old_values, fn val ->
            #
            Enum.member?(requested_variants, val)
          end)

          #
        end)

        # ^-- Deprecated, remove in Version 4
        |> Map.update!(:variants, fn old_values ->
          Enum.filter(old_values, fn %{name: name} ->
            Enum.member?(requested_variants, name)
          end)
        end)
      }
    end)
  end

  @doc """
  Get the absolute path of a certain file in the filesystem.

    __Parameters__
  - `uuid` the files uuid.
  - `project_identifier` the project's name.
  - `file_variant` the specific variant for the uuid, one of `#{inspect(@valid_file_variants)}`

  Returns the path as a String.
  """
  def get_file_path(uuid, project_identifier, file_variant) do
    path = "#{get_variant_directory(project_identifier, file_variant)}/#{uuid}"

    case File.stat(path) do
      {:error, _} = error ->
        error

      _ ->
        {:ok, path}
    end
  end

  @doc """
  Store binary data for the specified project.

  __Parameters__

  - `uuid` the uuid for the file (will be used as its file_name).
  - `project_identifier` the project's name.
  - `file_variant` a valid file variant, one of `#{inspect(@valid_file_variants)}`.
  - `data` the binary data to store.

  Returns `:ok` on success or `{:error, posix}` on failure. If a file already exists, it will not
  be replaced but the function will return `:ok` regardless.
  """
  def store(uuid, project_identifier, file_variant, data) do
    directory = get_variant_directory(project_identifier, file_variant)

    file_path = "#{directory}/#{uuid}"

    result =
      if File.exists?(file_path) do
        :ok
      else
        File.write(file_path, data)
      end

    clear_cache(project_identifier)
    result
  end

  @doc """
  Mark all file variants for a UUID/file as deleted.

  The function will add an empty tombstone file for the given UUID in all its existing variants. The FileStore
  will treat the UUID/files as deleted afterwards, but will actually keep the initial files in the file system.

  __Parameters__

  - `uuid` the uuid for the file (will be used as its file_name).
  - `project_identifier` the project's name.

  Returns `:ok`. If a file already exists, it will not be replaced but the
  function will return `:ok` regardless.
  """
  def discard(uuid, project_identifier) do
    @valid_file_variants
    |> Enum.map(&store("#{uuid}#{@tombstone_suffix}", project_identifier, &1, []))

    clear_cache(project_identifier)

    :ok
  end

  defp get_project_directory(project) do
    "#{@file_directory_root}/#{project}"
  end

  defp get_variant_directory(project, :original_image) do
    "#{get_project_directory(project)}/original_images"
  end

  defp get_variant_directory(project, :thumbnail_image) do
    "#{get_project_directory(project)}/thumbnail_images"
  end

  defp create_file_index(project) do
    @valid_file_variants
    |> Stream.map(&process_variant_directory(project, &1))
    |> reduce_to_single_index()
    |> Enum.map(fn {uuid, info} ->
      # For deleted files, we have tombstone files with the pattern <uuid>.<tombstone suffix>.
      # We do not want to have those tombstone names as keys in our file index, we want just
      # the UUID portion. So we strip the tombstone suffix from the key and instead set the value
      # behind the amended key accordingly.
      case String.ends_with?(uuid, @tombstone_suffix) do
        true ->
          {String.replace(uuid, @tombstone_suffix, ""), Map.put_new(info, :deleted, true)}

        _ ->
          {uuid, Map.put_new(info, :deleted, false)}
      end
    end)
    # Into map in order to be able to encode as JSON and to be shaped
    # according to the API schema.
    |> Enum.into(%{})
  end

  # Returns a map where each key is a uuid (file_name), and each value a map containing
  # the :size in bytes and :variant as requested in the function call.
  defp process_variant_directory(project, variant) do
    variant_directory = get_variant_directory(project, variant)

    variant_directory
    |> File.ls!()
    |> Stream.map(fn file_name ->
      # Evaluate file size and type
      %{
        size: stat_size,
        type: stat_type
      } = File.stat!("#{variant_directory}/#{file_name}")

      %{
        name: file_name,
        variant: variant,
        size: stat_size,
        stat_type: stat_type
      }
    end)
    |> Stream.reject(fn %{stat_type: type} -> type == :directory end)
    |> Stream.reject(fn %{name: file_name} ->
      # Reject all files containing dots, added to ignore hidden OS files
      file_name
      |> String.trim_trailing(@tombstone_suffix)
      |> String.contains?(".")
    end)
    |> remove_files_with_matching_tombstone()
    |> Enum.reduce(%{}, fn %{name: file_name, size: size, variant: variant}, acc ->
      acc
      |> Map.put(file_name, %{size: size, variant: variant})
    end)
  end

  defp remove_files_with_matching_tombstone(file_index) do
    tombstones =
      file_index
      |> Enum.filter(fn %{name: file_name} ->
        String.ends_with?(file_name, @tombstone_suffix)
      end)
      |> Enum.map(fn %{name: file_name} ->
        file_name
      end)

    file_index
    |> Enum.reject(fn %{name: file_name} ->
      "#{file_name}#{@tombstone_suffix}" in tombstones
    end)
  end

  defp reduce_to_single_index(variant_directories_data) do
    variant_directories_data
    |> Enum.reduce(%{}, fn variant_directory_data, acc ->
      variant_directory_data
      |> Enum.into(acc, fn {file_name, file_values} ->
        create_or_update_uuid(acc, file_name, file_values)
      end)
    end)
  end

  defp create_or_update_uuid(acc, uuid, %{size: size, variant: variant}) do
    case Map.get(acc, uuid) do
      nil ->
        {
          uuid,
          %{
            # TODO: Deprecate in 4.0
            types: [variant],
            variants: [%{name: variant, size: size}]
          }
        }

      existing_value ->
        {
          uuid,
          %{
            # TODO: Deprecate in 4.0
            types: Map.get(existing_value, :types) ++ [variant],
            variants: Map.get(existing_value, :variants) ++ [%{name: variant, size: size}]
          }
        }
    end
  end

  defp clear_cache(project) do
    Cachex.del(@index_cache_name, project)
  end
end
