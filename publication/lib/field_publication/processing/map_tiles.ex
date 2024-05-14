defmodule FieldPublication.Processing.MapTiles do
  alias FieldPublication.FileService
  alias FieldPublication.Publications.Data
  alias FieldPublication.Schemas.Publication
  # alias Api.Documents.Index
  # alias Api.Worker.Images.TilesCreator

  @filestore_root Application.compile_env(:field_publication, :file_store_directory_root)
  @dev_mode Application.compile_env(:field_publication, :dev_routes)

  def make_tiles(%Publication{} = publication) do
    raw_root = FileService.get_raw_data_path(publication.project_name)
    tiles_root = FileService.get_map_tiles_path(publication.project_name)

    File.mkdir_p!(tiles_root)

    tile_size = 256

    Data.get_doc_stream_for_georeferenced(publication)
    |> Enum.map(fn %{"resource" => %{"id" => uuid, "width" => width, "height" => height}} ->
      if FileService.raw_data_file_exists?(publication.project_name, uuid, :image) do
        derivate_info = calcuate_derivate_info(width, height, tile_size)

        raw_image_path = "#{raw_root}/image/#{uuid}"

        derivate_info
        |> Enum.map(fn %{scaled_size: scaled_size, z_index: z_index, xy_info: xy_info} ->
          original_temp_image_path = "#{tiles_root}/#{uuid}.#{scaled_size}.png"

          {raw_image_path, temp_image_path, base_cmd, args} =
            if @dev_mode do
              input_file_path =
                "/files/#{String.replace(raw_image_path, "#{@filestore_root}/", "")}"

              temp_image_path =
                "/files/#{String.replace(original_temp_image_path, "#{@filestore_root}/", "")}"

              # System.shell(
              #   "/files/#{target_file_path} -scale /files/#{temp_img_path}"
              # )

              {input_file_path, temp_image_path, "docker",
               ["exec", "-u", "root:root", "field_publication_cantaloupe", "convert"]}
            else
              {raw_image_path, original_temp_image_path, "convert", []}
            end

          unless File.exists?(original_temp_image_path) do
            System.cmd(
              base_cmd,
              args ++
                [
                  raw_image_path,
                  "-scale",
                  "#{scaled_size}x#{scaled_size}",
                  "-background",
                  "transparent",
                  temp_image_path
                ]
            )
          else
            :already_exists
          end

          Task.async_stream(
            xy_info,
            fn %{
                 x_index: x_index,
                 y_index: y_index,
                 x_pos: x_pos,
                 y_pos: y_pos
               } ->
              FileService.create_map_tiles_subdirectory(
                publication.project_name,
                uuid,
                z_index,
                x_index
              )

              target_image_path = "#{tiles_root}/#{uuid}/#{z_index}/#{x_index}/#{y_index}.png"

              {target_image_path, base_cmd, args} =
                if @dev_mode do
                  target_image_path =
                    "/files/#{String.replace(target_image_path, "#{@filestore_root}/", "")}"

                  {target_image_path, "docker",
                   ["exec", "-u", "root:root", "field_publication_cantaloupe", "convert"]}
                else
                  {target_image_path, "convert", []}
                end

              unless File.exists?(target_image_path) do
                System.cmd(
                  base_cmd,
                  args ++
                    [
                      temp_image_path,
                      "-quiet",
                      "-crop",
                      "#{tile_size}x#{tile_size}+#{x_pos}+#{y_pos}",
                      "-background",
                      "transparent",
                      "-extent",
                      "#{tile_size}x#{tile_size}",
                      target_image_path
                    ]
                )
              else
                :already_exists
              end
            end
          )

          File.rm(temp_image_path)
        end)
      else
        Logger.error("")
      end
    end)
  end

  def calcuate_derivate_info(width, height, tile_size) do
    image_size = Enum.max([width, height])

    Stream.unfold(
      image_size,
      fn current_size ->
        {
          {
            # our "rescale"
            current_size,
            # our "entries"
            calculate_derivate(current_size, tile_size)
          },
          current_size / 2
        }
      end
    )
    |> Stream.take_while(fn {current_size, _} -> current_size * 2 > tile_size end)
    |> Stream.map(fn {scaled_size, info} ->
      %{scaled_size: scaled_size, xy_info: info}
    end)
    |> Enum.reverse()
    # index will be our "z"
    |> Enum.with_index()
    |> Enum.map(fn {info, index} ->
      Map.put(info, :z_index, index)
    end)
  end

  defp calculate_derivate(current_size, tile_size) do
    fit_times =
      Integer.floor_div(floor(current_size), tile_size) +
        if Integer.mod(floor(current_size), tile_size) != 0 do
          1
        else
          0
        end

    Enum.reduce(
      0..(fit_times - 1),
      [],
      fn x_val, x_acc ->
        x_acc ++
          [
            Enum.reduce(
              0..(fit_times - 1),
              [],
              fn y_val, y_acc ->
                y_acc ++
                  [
                    %{
                      x_index: x_val,
                      y_index: y_val,
                      x_pos: x_val * tile_size,
                      y_pos: y_val * tile_size
                    }
                  ]
              end
            )
          ]
      end
    )
    |> List.flatten()
  end
end
