defmodule FieldPublication.Processing.Imagemagick do
  @moduledoc """
  This module is a wrapper around functions that use imagemagic shell commands.

  In development or test environemnts each function uses the Cantaloupe docker service
  to process the image data, in production it will use the FieldPublication application
  container. The idea being, that by using the cantaloupe service in development, developers
  do not need to keep track of their local imagemagick version to ensure compatibality with the
  production environment.

  On the flipside, the ImageMagick versions used by the docker images `field_publication` and
  `field_publication_cantaloupe` should therefore always be kept aligned.
  """

  @filestore_root Application.compile_env(:field_publication, :file_store_directory_root)
  @dev_mode Application.compile_env(:field_publication, :dev_routes)

  @dialyzer {:nowarn_function, create_jp2: 2}
  def create_jp2(input_file_path, target_file_path) do
    if @dev_mode do
      input_file_path = String.replace(input_file_path, "#{@filestore_root}/", "")
      target_file_path = String.replace(target_file_path, "#{@filestore_root}/", "")

      {"", 0} =
        System.shell(
          "docker exec -u root:root field_publication_cantaloupe convert /files/#{input_file_path} /files/#{target_file_path}"
        )
    else
      System.cmd("convert", [input_file_path, target_file_path])
    end
  end
end
