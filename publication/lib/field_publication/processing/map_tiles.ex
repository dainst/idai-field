defmodule FieldPublication.Processing.MapTiles do
  alias FieldPublication.FileService
  alias FieldPublication.Publications.Data
  alias FieldPublication.Schemas.Publication

  require Logger

  @filestore_root Application.compile_env(:field_publication, :file_store_directory_root)
  @dev_mode Application.compile_env(:field_publication, :dev_routes)

  @tile_size 256

  def start_tile_creation(publication) do
    raw_root = FileService.get_raw_data_path(publication.project_name)
    tiles_root = FileService.get_map_tiles_path(publication.project_name)

    File.mkdir_p!(tiles_root)

    Data.get_doc_stream_for_georeferenced(%Publication{} = publication)
    |> Enum.map(fn %{"resource" => %{"id" => uuid, "width" => width, "height" => height}} ->
      if FileService.raw_data_file_exists?(publication.project_name, uuid, :image) do
        derivate_info = calcuate_derivate_info(width, height, @tile_size)
        raw_image_path = "#{raw_root}/image/#{uuid}"

        derivate_info
        |> Enum.map(fn %{scaled_size: scaled_size, z_index: z_index, xy_info: _xy_info} ->
          original_z_index_path = "#{tiles_root}/#{uuid}/#{z_index}"

          {raw_image_path, z_index_path, base_cmd, args} =
            if @dev_mode do
              input_file_path =
                "/files/#{String.replace(raw_image_path, "#{@filestore_root}/", "")}"

              temp_image_path =
                "/files/#{String.replace(original_z_index_path, "#{@filestore_root}/", "")}"

              {input_file_path, temp_image_path, "docker",
               ["exec", "-u", "root:root", "field_publication_cantaloupe", "convert"]}
            else
              {raw_image_path, original_z_index_path, "convert", []}
            end

          File.mkdir_p!(original_z_index_path)

          temp_image_path = "#{z_index_path}/temp.png"

          next_multiple =
            @tile_size * Float.ceil(scaled_size / @tile_size)

          System.cmd(
            base_cmd,
            args ++
              [
                raw_image_path,
                "-background",
                "none",
                "-scale",
                "#{scaled_size}x#{scaled_size}",
                "-extent",
                "#{next_multiple}x#{next_multiple}",
                temp_image_path
              ]
          )

          Logger.debug(
            "Creating tiles for image `#{uuid}` in project `#{publication.project_name}` with z index of #{z_index} (#{next_multiple} x #{next_multiple} base image)..."
          )

          System.shell(
            "docker exec -w #{z_index_path} -uroot:root field_publication_cantaloupe convert temp.png -crop #{@tile_size}x#{@tile_size} -background transparent -extent #{@tile_size}x#{@tile_size} -set 'filename:tile' '%[fx:page.x/#{@tile_size}]_%[fx:page.y/#{@tile_size}]' +repage +adjoin 'tile_%[filename:tile].png'"
          )

          File.rm!("#{original_z_index_path}/temp.png")

          File.ls!(original_z_index_path)
          |> Enum.map(fn file_name ->
            [_tile, x_maybe_float, y_dot_png] = String.split(file_name, "_")

            {x, _remainder} = Integer.parse(x_maybe_float)
            {y, _remainder} = String.replace_suffix(y_dot_png, ".png", "") |> Integer.parse()

            final_tile_dir = "#{original_z_index_path}/#{x}"
            final_tile_file = "#{final_tile_dir}/#{y}.png"

            File.mkdir_p!(final_tile_dir)
            File.cp_r!("#{original_z_index_path}/#{file_name}", final_tile_file)
            File.rm!("#{original_z_index_path}/#{file_name}")
          end)
        end)
      else
        Logger.error("Todo")
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
