defmodule FieldHub.FileStore do
  @file_directory_root Application.compile_env(:field_hub, :file_directory_root)
  @tombstone_suffix ".deleted"
  @variant_types Application.compile_env(:field_hub, :file_variant_types)
  @cache_name Application.compile_env(:field_hub, :file_info_cache_name)
  @cache_expiration_ms 1000 * 60 * 60 * 24

  require Logger

  @doc """
  Create directories for a project. Returns a success/error status for each file variant subdirectory.
  """
  def create_directories(project_name) do
    @variant_types
    |> Enum.map(fn type ->
      get_type_directory(project_name, type)
      |> File.mkdir_p()
    end)
    |> Enum.zip(@variant_types)
  end

  @doc """
  Remove all file directories for a project, not reversable.
  """
  def remove_directories(project_name) do
    clear_cache(project_name)

    project_name
    |> get_project_directory()
    |> File.rm_rf()
  end

  @doc """
  Get a map containing file information for a project. If no specific variants are requested
  all files are returned.

  ## Examples

      iex> FileStore.get_file_list("development", [:original_images])
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
  def get_file_list(project_name, requested_variants \\ @variant_types) do
    get_file_map_cache(project_name)
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
    # TODO: Remove in Version 4
    |> Map.new(fn {uuid, info} ->
      {
        uuid,
        info
        |> Map.update!(:types, fn old_values ->
          Enum.filter(old_values, fn val ->
            Enum.member?(requested_variants, val)
          end)
        end)
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
  """
  def get_file_path(uuid, project, variant) do
    path = "#{get_type_directory(project, variant)}/#{uuid}"

    case File.stat(path) do
      {:error, _} = error ->
        error

      _ ->
        {:ok, path}
    end
  end

  def store_file(uuid, project, type, data) do
    directory = get_type_directory(project, type)

    file_path = "#{directory}/#{uuid}"

    result =
      if not File.exists?(file_path) do
        File.write(file_path, data)
      else
        :ok
      end

    clear_cache(project)
    result
  end

  def delete(uuid, project) do
    result =
      @variant_types
      |> Stream.filter(fn variant ->
        directory = get_type_directory(project, variant)
        File.exists?("#{directory}/#{uuid}")
      end)
      |> Stream.map(&store_file("#{uuid}#{@tombstone_suffix}", project, &1, []))
      |> Enum.filter(fn val ->
        val != :ok
      end)
      |> case do
        [] ->
          :ok

        errors ->
          errors
      end

    clear_cache(project)
    result
  end

  def get_supported_variant_types() do
    @variant_types
  end

  defp get_project_directory(project) do
    "#{@file_directory_root}/#{project}"
  end

  defp get_type_directory(project, :original_image) do
    "#{get_project_directory(project)}/original_images"
  end

  defp get_type_directory(project, :thumbnail_image) do
    "#{get_project_directory(project)}/thumbnail_images"
  end

  defp get_file_map_cache(project) do
    case Cachex.get(@cache_name, project) do
      {:ok, nil} ->
        file_map = get_file_map(project)
        Cachex.put!(@cache_name, project, file_map, ttl: @cache_expiration_ms)
        file_map

      {:ok, file_map} ->
        file_map
    end
  end

  defp get_file_map(project) do
    @variant_types
    |> Stream.map(&get_file_map_for_variant(project, &1))
    |> Enum.reduce(%{}, fn variant_map, acc ->
      # Reduce all file maps (one for each type) to a single map
      variant_map
      |> Enum.into(acc, fn {filename, %{size: size, variant: variant}} ->
        case Map.has_key?(acc, filename) do
          false ->
            {
              filename,
              %{
                # TODO: Deprecate in 4.0
                types: [variant],
                variants: [%{name: variant, size: size}]
              }
            }

          true ->
            existing_value = Map.get(acc, filename)

            {
              filename,
              %{
                # TODO: Deprecate in 4.0
                types: Map.get(existing_value, :types) ++ [variant],
                variants: Map.get(existing_value, :variants) ++ [%{name: variant, size: size}]
              }
            }
        end
      end)
    end)
    |> Stream.map(fn {uuid, info} ->
      case String.ends_with?(uuid, @tombstone_suffix) do
        true ->
          {String.replace(uuid, @tombstone_suffix, ""), Map.put_new(info, :deleted, true)}

        _ ->
          {uuid, Map.put_new(info, :deleted, false)}
      end
    end)
    # tuple to map, because tuple can't be encoded as JSON
    |> Enum.into(%{})
  end

  defp get_file_map_for_variant(project, variant) do
    type_directory = get_type_directory(project, variant)

    type_directory
    |> File.ls!()
    |> Stream.map(fn filename ->
      %{
        size: size,
        type: type
      } = File.stat!("#{type_directory}/#{filename}")

      %{
        name: filename,
        variant: variant,
        size: size,
        type: type
      }
    end)
    |> Stream.reject(fn file_info ->
      # Rejecting directories
      case file_info do
        %{type: :directory} ->
          true

        _ ->
          false
      end
    end)
    |> Stream.map(fn file_info ->
      # After rejecting directories we do not need the type field anymore
      Map.delete(file_info, :type)
    end)
    |> Stream.reject(fn %{name: filename} ->
      # Reject all files containing dots (beside tombstone files)
      filename
      |> String.trim_trailing(@tombstone_suffix)
      |> String.contains?(".")
    end)
    |> ignore_files_with_existing_tombstones()
    |> Enum.reduce(%{}, fn %{name: filename, size: size, variant: variant}, acc ->
      acc
      |> Map.put(filename, %{size: size, variant: variant})
    end)
  end

  defp ignore_files_with_existing_tombstones(file_infos) do
    deleted =
      file_infos
      |> Enum.map(fn %{name: filename} ->
        filename
      end)
      |> Enum.filter(fn filename ->
        String.ends_with?(filename, @tombstone_suffix)
      end)

    Enum.filter(file_infos, fn %{name: filename} ->
      "#{filename}#{@tombstone_suffix}" not in deleted
    end)
  end

  defp clear_cache(project) do
    Cachex.del(@cache_name, project)
  end
end
