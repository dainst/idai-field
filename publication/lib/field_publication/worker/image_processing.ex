defmodule FieldPublication.Worker.ImageProcessing do

  alias FieldPublication.{
    FileService
  }

  @web_images_directory Application.get_env(:field_publication, :web_images_directory_root)
  @im_cmd Application.compile_env(:field_publication, :image_magick_convert_base_command)

  @filestore_root Application.compile_env(:field_publication, :file_store_directory_root)

  @run_image_magic_locally Application.compile_env(:field_publication, :run_image_magic_locally, false)

  def prepare_publication(publication_name) do
    source_files =
      publication_name
      |> FileService.get_image_list()

    target_folder = "#{@web_images_directory}/#{publication_name}"
    File.mkdir_p!(target_folder)

    source_files
    |> Stream.map(fn(source_file) ->
      {source_file, "#{target_folder}/#{Path.basename(source_file)}.jp2"}
    end)
    |> Enum.map(&convert_file/1)
  end

  defp convert_file({input_file_path, target_file_path}) do
    if @run_image_magic_locally do
      System.cmd("convert", [input_file_path, target_file_path])
    else
      input_file_path = String.replace(input_file_path, "#{@filestore_root}/", "")
      target_file_path = String.replace(target_file_path, "#{@web_images_directory}/", "")

      IO.inspect("Running in cantaloupe container.")

      System.cmd(
        "docker", [
          "exec",
          "field_publication_cantaloupe",
          "convert",
          "/source_images/#{input_file_path}",
          "/imageroot/#{target_file_path}"
        ]
      )
    end
  end
end
