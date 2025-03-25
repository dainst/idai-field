defmodule FieldPublication.Processing.MapTiles do
  alias Phoenix.PubSub
  require Logger

  alias Vix.Vips.{
    Image,
    Operation
  }

  alias FieldPublication.FileService
  alias FieldPublication.Publications
  alias FieldPublication.Publications.Data
  alias FieldPublication.DatabaseSchema.Publication

  @tile_size 256

  @moduledoc """
  This module contains functions for creating image tiles from raw image data to be served as
  TileLayer sources in OpenLayer maps.

  The result will be a nested directory structure with a specific file name pattern representing
  different zoom levels and x/y coordinates for each tiled image.
  """

  def evaluate_state(%Publication{} = publication) do
    FileService.initialize!(publication.project_name)

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
        {:ok, image} = Image.new_from_file("#{raw_root}/image/#{uuid}")

        max = if width < height, do: height, else: width

        max =
          (@tile_size * Float.ceil(max / @tile_size)) |> trunc()

        if Image.has_alpha?(image) do
          image
        else
          Operation.bandjoin_const!(image, [255.0])
        end
        |> Operation.embed!(0, 0, max, max,
          background: [+0.0],
          extent: :VIPS_EXTEND_BACKGROUND
        )
        |> Operation.dzsave!("#{tiles_root}/#{uuid}",
          "tile-size": @tile_size,
          suffix: ".png",
          layout: :VIPS_FOREIGN_DZ_LAYOUT_GOOGLE,
          overlap: 0,
          depths: :VIPS_FOREIGN_DZ_DEPTH_ONETILE,
          "skip-blanks": -1,
          background: [0.0]
        )

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
end
