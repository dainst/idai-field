defmodule FieldPublication.Processing.MapTiles do
  alias FieldPublication.FileService
  alias FieldPublication.Publications
  alias FieldPublication.Publications.Data
  alias FieldPublication.DocumentSchema.Publication
  alias Phoenix.PubSub
  require Logger

  @tile_size 256

  def evaluate_state(%Publication{} = publication) do
    FileService.initialize(publication.project_name)

    existing_tiles = FileService.list_tile_image_directories(publication.project_name)

    georeferenced_docs =
      Data.get_doc_stream_for_georeferenced(publication)
      |> Enum.to_list()

    missing =
      Enum.reject(georeferenced_docs, fn %{"_id" => uuid} ->
        uuid in existing_tiles
      end)

    overall_count = Enum.count(georeferenced_docs)
    existing_count = Enum.count(existing_tiles)

    %{
      existing: existing_tiles,
      missing: missing,
      summary: %{
        overall: overall_count,
        counter: existing_count,
        percentage: if(overall_count > 0, do: existing_count / overall_count * 100, else: 0)
      }
    }
  end

  def start_tile_creation(%Publication{} = publication) do
    # TODO: Construct all paths in FileService module.
    raw_root = FileService.get_raw_data_path(publication.project_name)
    tiles_root = FileService.get_map_tiles_path(publication.project_name)

    %{missing: missing, summary: summary} =
      evaluate_state(publication)

    File.mkdir_p!(tiles_root)

    {:ok, counter_pid} =
      Agent.start_link(fn -> summary end)

    doc_id = Publications.get_doc_id(publication)

    missing
    |> Enum.map(fn %{"resource" => %{"id" => uuid, "width" => width, "height" => height}} ->
      if FileService.raw_data_file_exists?(publication.project_name, uuid, :image) do
        scalings_for_z_indices = get_scalings_for_z_indices(width, height, @tile_size)
        raw_image_path = "#{raw_root}/image/#{uuid}"

        scalings_for_z_indices
        |> Enum.map(fn %{scaled_size: scaled_size, z_index: z_index} ->
          original_z_index_path = "#{tiles_root}/#{uuid}/#{z_index}"

          next_multiple =
            @tile_size * Float.ceil(scaled_size / @tile_size)

          Logger.debug(
            "Creating tiles for image `#{uuid}` in project `#{publication.project_name}` with z index of #{z_index} (#{next_multiple} x #{next_multiple} base image)..."
          )

          FieldPublication.Processing.Imagemagick.create_tiling_temp_file(
            raw_image_path,
            original_z_index_path,
            scaled_size,
            next_multiple
          )

          FieldPublication.Processing.Imagemagick.create_tiles(original_z_index_path, @tile_size)

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

        updated_state =
          Agent.get_and_update(counter_pid, fn %{counter: counter, overall: overall} = state ->
            state =
              state
              |> Map.put(:counter, counter + 1)
              |> Map.put(:percentage, (counter + 1) / overall * 100)

            {state, state}
          end)

        PubSub.broadcast(
          FieldPublication.PubSub,
          doc_id,
          {
            :tile_image_processing_count,
            updated_state
          }
        )
      else
        Logger.error(
          "No raw image file `#{uuid}` for project `#{publication.project_name}`. Unable to create tiles..."
        )
      end
    end)
  end

  defp get_scalings_for_z_indices(width, height, tile_size) do
    max = Enum.max([width, height])

    Stream.unfold(max, fn current_size ->
      if current_size * 2 < tile_size do
        # The previous size was already smaller than the tile size,
        # so stop generating new values.
        nil
      else
        {
          current_size,
          current_size / 2
        }
      end
    end)
    |> Enum.reverse()
    |> Stream.with_index()
    |> Enum.map(fn {scaled_size, index} ->
      %{
        z_index: index,
        scaled_size: scaled_size
      }
    end)
  end
end
