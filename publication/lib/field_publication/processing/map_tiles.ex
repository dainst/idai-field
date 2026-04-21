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

  alias FieldPublication.DatabaseSchema.{
    DataIssue,
    LogEntry,
    Publication
  }

  @tile_size 256
  @data_report_key "map_tiles_processing"

  @moduledoc """
  This module contains functions for creating image tiles from raw image data to be served as
  TileLayer sources in OpenLayer maps.

  The result will be a nested directory structure with a specific file name pattern representing
  different zoom levels and x/y coordinates for each tiled image.
  """

  def evaluate_state(%Publication{} = publication) do
    FileService.initialize!(publication.project_name)

    %{image: current_raw_files} = FileService.list_raw_data_files(publication.project_name)

    existing_tiles = FileService.list_tile_image_directories(publication.project_name)

    georeferenced_docs =
      Data.get_doc_stream_for_georeferenced(publication)
      |> Enum.to_list()

    missing =
      Enum.reject(georeferenced_docs, fn %{"_id" => uuid} ->
        uuid in existing_tiles
      end)

    missing_raw_files = Enum.map(missing, fn %{"_id" => uuid} -> uuid end) -- current_raw_files

    missing_that_could_be_generated =
      Enum.reject(missing, fn %{"_id" => uuid} ->
        uuid in missing_raw_files
      end)

    overall_count = Enum.count(georeferenced_docs)
    existing_count = Enum.count(existing_tiles)

    Publications.clear_data_issues(publication, @data_report_key)

    Enum.each(missing_raw_files, fn uuid ->
      Publications.report_data_issue(publication, %DataIssue{
        uuid: uuid,
        reported_by: @data_report_key,
        issue_type_key: "missing_image_file",
        log: %LogEntry{
          severity: :warning,
          message: "Missing raw image file."
        }
      })
    end)

    %{
      existing: existing_tiles,
      documents_awaiting_processing: missing_that_could_be_generated,
      summary: %{
        overall: overall_count,
        counter: existing_count,
        percentage: if(overall_count > 0, do: existing_count / overall_count * 100, else: 0)
      }
    }
  end

  def start(%Publication{project_name: project_key} = publication) do
    tiles_root = FileService.get_map_tiles_base_path(project_key)

    %{documents_awaiting_processing: waiting, summary: summary} =
      evaluate_state(publication)

    File.mkdir_p!(tiles_root)

    {:ok, counter_pid} =
      Agent.start_link(fn -> summary end)

    doc_id = Publications.get_doc_id(publication)

    quarter_of_all_schedulers = trunc(System.schedulers() * 0.25)

    concurrent_processes =
      if quarter_of_all_schedulers >= 1, do: quarter_of_all_schedulers, else: 1

    result =
      waiting
      |> Task.async_stream(
        fn
          %{"resource" => %{"id" => uuid, "width" => width, "height" => height}} ->
            {:ok, image} =
              project_key
              |> FileService.get_raw_image_data_path(uuid)
              |> Image.new_from_file()

            target_base_path = FileService.get_map_tiles_base_path(project_key, uuid)

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
            |> Operation.dzsave!(target_base_path,
              "tile-size": @tile_size,
              suffix: ".webp",
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

          %{"_id" => uuid} ->
            Publications.report_data_issue(publication, %DataIssue{
              uuid: uuid,
              reported_by: @data_report_key,
              issue_type_key: "invalid_document_structure",
              log: %LogEntry{
                severity: :warning,
                message:
                  "The document is missing either 'width' or 'height' or both parameters and can not be processed as a map tile as a result."
              }
            })
        end,
        max_concurrency: concurrent_processes,
        timeout: 1000 * 60 * 5
      )
      |> Enum.to_list()

    # See https://github.com/akash-akya/vix/issues/197
    File.rm("#{tiles_root}/vips-properties.xml")

    result
  end
end
