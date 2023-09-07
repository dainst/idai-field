defmodule FieldPublication.Worker.ImageProcessing do
  alias FieldPublication.{
    FileService
  }

  @web_images_directory Application.compile_env(:field_publication, :web_images_directory_root)
  @filestore_root Application.compile_env(:field_publication, :file_store_directory_root)
  @dev_mode Application.compile_env(:field_publication, :dev_routes)

  def prepare_publication(publication_name) do
    source_files =
      publication_name
      |> FileService.get_image_list()

    target_folder = "#{@web_images_directory}/#{publication_name}"

    create_target_directory(target_folder)

    source_files
    |> Stream.map(fn source_file ->
      {source_file, "#{target_folder}/#{Path.basename(source_file)}.jp2"}
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
