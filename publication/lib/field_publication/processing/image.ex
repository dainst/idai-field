defmodule FieldPublication.Processing.Image do
  alias FieldPublication.FileService

  @web_images_directory Application.compile_env(:field_publication, :web_images_directory_root)
  @filestore_root Application.compile_env(:field_publication, :file_store_directory_root)
  @dev_mode Application.compile_env(:field_publication, :dev_routes)

  def prepare_publication(project_key, publication_name) do
    {:ok, source_files} =
      project_key
      |> FileService.list_publication_files(publication_name)

    target_folder = "#{@web_images_directory}/#{publication_name}"

    create_target_directory(target_folder)

    source_directory = FileService.get_publication_path(project_key, publication_name)

    source_files
    |> Stream.map(fn source_file ->
      {"#{source_directory}/#{source_file}", "#{target_folder}/#{Path.basename(source_file)}.jp2"}
    end)
    |> Enum.map(&convert_file/1)
  end

  defp create_target_directory(target_path) do
    if @dev_mode do
      target_path = String.replace(target_path, "#{@web_images_directory}/", "")

      System.cmd(
        "docker",
        [
          "exec",
          "field_publication_cantaloupe",
          "mkdir",
          "-p",
          "/image_root/#{target_path}"
        ]
      )
    else
      File.mkdir_p!(target_path)
    end
  end

  defp convert_file({input_file_path, target_file_path}) do
    if @dev_mode do
      input_file_path = String.replace(input_file_path, "#{@filestore_root}/", "")
      target_file_path = String.replace(target_file_path, "#{@web_images_directory}/", "")

      System.cmd(
        "docker",
        [
          "exec",
          "field_publication_cantaloupe",
          "convert",
          "/source_images/#{input_file_path}",
          "/image_root/#{target_file_path}"
        ]
      )
    else
      System.cmd("convert", [input_file_path, target_file_path])
    end
  end
end
