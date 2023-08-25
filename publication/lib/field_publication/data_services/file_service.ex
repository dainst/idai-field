defmodule FieldPublication.FileService do
  @root_path Application.compile_env(:field_publication, :file_store_directory_root)

  require Logger

  def get_publication_path(publication_name) do
    "#{@root_path}/#{publication_name}"
  end

  def get_image_list(publication_name) do
    root_path = get_publication_path(publication_name)

    "#{root_path}/original_image"
    |> File.ls()
    |> case do
      {:ok, files} ->
        Enum.map(files, fn(file) -> "#{root_path}/original_image/#{file}" end)
      error ->
        error
    end
  end
end
