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

  @dialyzer {:nowarn_function, create_tiling_temp_file: 4}
  def create_tiling_temp_file(source_path, target_path, scale_size, extent_size) do
    File.mkdir_p!(target_path)

    if @dev_mode do
      source_path =
        "/files/#{String.replace(source_path, "#{@filestore_root}/", "")}"

      target_path =
        "/files/#{String.replace(target_path, "#{@filestore_root}/", "")}"

      System.shell(
        "docker exec -u root:root field_publication_cantaloupe convert #{source_path} -background none -scale #{scale_size}x#{scale_size} -extent #{extent_size}x#{extent_size} #{target_path}/temp.png"
      )
    else
      System.shell(
        "convert #{source_path} -background none -scale #{scale_size}x#{scale_size} -extent #{extent_size}x#{extent_size} #{target_path}/temp.png"
      )
    end
  end

  @dialyzer {:nowarn_function, create_tiles: 2}
  def create_tiles(directory_path, tile_size) do
    if @dev_mode do
      directory_path = "/files/#{String.replace(directory_path, "#{@filestore_root}/", "")}"

      System.shell(
        "docker exec -w #{directory_path} -uroot:root field_publication_cantaloupe convert temp.png -crop #{tile_size}x#{tile_size} -background transparent -extent #{tile_size}x#{tile_size} -set 'filename:tile' '%[fx:page.x/#{tile_size}]_%[fx:page.y/#{tile_size}]' +repage +adjoin 'tile_%[filename:tile].png'"
      )
    else
      System.shell(
        "convert temp.png -crop #{tile_size}x#{tile_size} -background transparent -extent #{tile_size}x#{tile_size} -set 'filename:tile' '%[fx:page.x/#{tile_size}]_%[fx:page.y/#{tile_size}]' +repage +adjoin 'tile_%[filename:tile].png'",
        cd: directory_path
      )
    end
  end
end
