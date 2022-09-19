defmodule FieldHub.FileStore do
  @file_directory_root Application.get_env(:field_hub, :file_directory_root)
  @tombstone_suffix ".deleted"
  @variant_types Application.get_env(:field_hub, :file_variant_types)

  require Logger

  def create_directories(project) do
    @variant_types
    |> Enum.map(fn type ->
      get_type_directory(project, type)
      |> File.mkdir_p()
    end)
    |> Enum.zip(@variant_types)
  end

  def remove_directories(project) do
    project
    |> get_project_directory()
    |> File.rm_rf()
  end

  def get_file_list(project, variants \\ @variant_types) do
    variants
    |> Stream.map(&get_file_map_for_variant(project, &1))
    |> Enum.reduce(%{}, fn variant_map, acc ->
      # Reduce all file maps (one for each type) to a single map
      variant_map
      |> Enum.into(%{}, fn {filename, %{size: size, variant: variant}} ->
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

  def get_file_path(%{uuid: uuid, project: project, type: type}) do
    path = "#{get_type_directory(project, type)}/#{uuid}"

    case File.stat(path) do
      {:error, _} = error ->
        error

      _ ->
        {:ok, path}
    end
  end

  def store_file(%{uuid: uuid, project: project, type: type, content: content}) do
    directory = get_type_directory(project, type)
    File.mkdir_p!(directory)
    file_path = "#{directory}/#{uuid}"

    if not File.exists?(file_path) do
      File.write(file_path, content)
    else
      :ok
    end
  end

  def delete(%{uuid: uuid, project: project}) do
    @variant_types
    |> Stream.filter(fn variant ->
      directory = get_type_directory(project, variant)
      File.exists?("#{directory}/#{uuid}")
    end)
    |> Stream.map(
      &store_file(%{uuid: "#{uuid}#{@tombstone_suffix}", project: project, type: &1, content: []})
    )
    |> Enum.filter(fn val ->
      val != :ok
    end)
    |> case do
      [] ->
        :ok

      errors ->
        errors
    end
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
end
