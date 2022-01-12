defmodule FieldHub.FileStore do

  @file_directory_root Application.get_env(:field_hub, :file_directory_root)
  @tombstoneSuffix ".deleted"

  def get_file_list(%{project: project, type: type}) do
    get_type_directory(project, type)
    |> File.ls()
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

  defp get_type_directory(project, :original_image) do
    "#{@file_directory_root}/#{project}/original_images"
  end

  defp get_type_directory(project, :thumbnail_image) do
    "#{@file_directory_root}/#{project}/thumbnail_images"
  end
end
