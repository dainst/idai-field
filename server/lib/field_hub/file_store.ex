defmodule FieldHub.FileStore do

  @file_directory_root Application.get_env(:field_hub, :file_directory_root)
  @tombstoneSuffix ".deleted"
  @variant_types [:original_image, :thumbnail_image]

  def create_directories(project) do
    @variant_types
    |> Enum.map(fn(type) ->
      get_type_directory(project, type)
      |> File.mkdir_p()
    end)
    |> Enum.zip(@variant_types)
  end

  def get_file_list(project, variants \\ @variant_types) do
      variants
      |> Stream.map(&get_type_directory(project, &1))
      |> Stream.map(&File.ls!(&1))
      |> Stream.map(&filter_with_existing_tombstone(&1))
      |> Stream.zip(variants)
      |> Stream.map(fn({file_list, variant_type}) ->
        file_list
        |> Enum.map(fn(uuid) ->
          {uuid, [variant_type]}
        end)
      end)
      |> Enum.reduce(%{}, fn(file_list, acc) ->
        file_list
        |> Map.new(fn({uuid, [variant_type]}) ->
          case uuid in Map.keys(acc) do
            true ->
              %{types: types} = Map.get(acc, uuid)
              {uuid, %{types: types ++ [variant_type]}}
            _ ->
              {uuid, %{types: [variant_type]}}
            end
          end)
        end)
      |> Enum.map(fn({uuid, info}) ->
        case String.ends_with?(uuid, @tombstoneSuffix) do
          true ->
            {String.replace(uuid, @tombstoneSuffix, ""), Map.put_new(info, :deleted, true)}
          _ ->
            {uuid, Map.put_new(info, :deleted, false)}
        end
      end)
      |> Enum.into(%{}) # tuple to map, because tuple can't be encoded as JSON
  end

  def get_file_path(%{uuid: uuid, project: project, type: type}) do
    path = "#{get_type_directory(project, type)}/#{uuid}"

    case File.lstat(path) do
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
    File.write(file_path, content)
  end

  def delete(%{uuid: uuid, project: project}) do

    @variant_types
    |> Stream.filter(fn(variant) ->
      directory = get_type_directory(project, variant)
      File.exists?("#{directory}/#{uuid}")
    end)
    |> Stream.map(&store_file(%{uuid: "#{uuid}#{@tombstoneSuffix}", project: project, type: &1, content: []}))
    |> Enum.filter(fn(val) ->
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

  defp filter_with_existing_tombstone(files) do
    deleted =
      files
      |> Enum.filter(fn(filename) ->
        String.ends_with?(filename, @tombstoneSuffix)
      end)

    Enum.filter(files, fn(filename) -> "#{filename}#{@tombstoneSuffix}" not in deleted end)
  end
end
