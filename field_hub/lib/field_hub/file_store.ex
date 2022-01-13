defmodule FieldHub.FileStore do

  @file_directory_root Application.get_env(:field_hub, :file_directory_root)
  @tombstoneSuffix ".deleted"

  def get_file_list(%{project: project, type: type}) do
    file_system_response =
      get_type_directory(project, type)
      |> File.ls()

    case file_system_response do
      {:error, _} = error ->
        error
      {:ok, files} ->
        deleted =
          files
          |> Enum.filter(fn(filename) -> String.ends_with?(filename, @tombstoneSuffix) end)

        {
          :ok,
          Enum.filter(files, fn(filename) -> "#{filename}#{@tombstoneSuffix}" not in deleted end)
        }
    end

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

  defp get_type_directory(project, :original_image) do
    "#{@file_directory_root}/#{project}/original_images"
  end

  defp get_type_directory(project, :thumbnail_image) do
    "#{@file_directory_root}/#{project}/thumbnail_images"
  end
end
