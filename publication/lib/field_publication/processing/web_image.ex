defmodule FieldPublication.Processing.WebImage do
  alias Vix.Vips.{
    Image,
    Operation
  }

  alias FieldPublication.FileService
  alias FieldPublication.Publications

  alias FieldPublication.DatabaseSchema.{
    LogEntry,
    Publication
  }

  require Logger

  @moduledoc """
  This module contains functions for creating TIFF images from raw image data to be served
  by the IIIF image plug.
  """

  @data_report_key "processing_web_image"

  def report_key(), do: @data_report_key

  def evaluate_web_images_state(
        %Publication{project_identifier: project_identifier} = publication
      ) do
    %{image: current_raw_files} = FileService.list_raw_data_files(project_identifier)

    current_web_files = FileService.list_web_image_files(project_identifier)

    image_categories = Publications.Data.get_image_categories(publication)

    {existing, missing} =
      Publications.Data.get_doc_stream_for_categories(publication, image_categories)
      |> Stream.map(fn %{"_id" => uuid} ->
        uuid
      end)
      |> Enum.split_with(fn uuid ->
        "#{uuid}.tif" in current_web_files
      end)

    missing_raw_files = missing -- current_raw_files
    existing_raw_files = missing -- missing_raw_files

    overall_count = Enum.count(existing) + Enum.count(missing)
    existing_count = Enum.count(existing)

    %{
      processed: existing,
      existing_raw_files: existing_raw_files,
      missing_raw_files: missing_raw_files,
      summary: %{
        overall: overall_count,
        counter: existing_count,
        percentage: if(overall_count > 0, do: existing_count / overall_count * 100, else: 0)
      }
    }
  end

  def start(%Publication{project_identifier: project_identifier} = publication) do
    %{
      existing_raw_files: existing_raw_files,
      summary: summary,
      missing_raw_files: missing_raw_files
    } = evaluate_web_images_state(publication)

    Publications.Data.clear_data_issues(publication, @data_report_key)

    Publications.Data.report_data_issues(
      Enum.map(missing_raw_files, fn uuid ->
        {uuid,
         LogEntry.create(%{
           type: "missing_image_file",
           reported_by: @data_report_key,
           severity: :warning,
           message: "Missing raw image file."
         })}
      end),
      publication
    )

    quarter_of_all_schedulers = trunc(System.schedulers() * 0.25)

    concurrent_processes =
      if quarter_of_all_schedulers >= 1, do: quarter_of_all_schedulers, else: 1

    {:ok, counter_pid} =
      Agent.start_link(fn -> summary end)

    existing_raw_files
    |> Task.async_stream(
      fn uuid ->
        Logger.debug(
          "Creating web image (pyramid TIFF) for '#{uuid}' in project '#{project_identifier}'..."
        )

        project_identifier
        |> FileService.get_raw_image_data_path(uuid)
        |> Image.new_from_file()
        |> case do
          {:error, _} ->
            Publications.Data.report_data_issue(
              uuid,
              %LogEntry{
                type: "invalid_file",
                reported_by: @data_report_key,
                severity: :warning,
                message: "The file could not be opened as an image."
              },
              publication
            )

          {:ok, file} ->
            # Apply exif rotation metadata directly to the image data (if present), because we do not
            # want end user's web browser to rotate image tiles because of the metadata.
            {:ok, {file, _}} = Operation.autorot(file)

            target_path = FileService.get_web_images_path(project_identifier, uuid)

            :ok =
              Operation.tiffsave(file, target_path,
                pyramid: true,
                "tile-height": 256,
                "tile-width": 256,
                tile: true,
                # See https://iipimage.sourceforge.io/2024/12/tiff-image-encoding-optimizing-for-size-speed-and-quality
                compression: :VIPS_FOREIGN_TIFF_COMPRESSION_DEFLATE
              )

            updated_state =
              Agent.get_and_update(counter_pid, fn %{counter: counter, overall: overall} = state ->
                state =
                  state
                  |> Map.put(:counter, counter + 1)
                  |> Map.put(:percentage, (counter + 1) / overall * 100)

                {state, state}
              end)

            Publications.broadcast(
              publication,
              {:processing_progress, :web_images, updated_state}
            )
        end
      end,
      max_concurrency: concurrent_processes,
      timeout: 1000 * 60 * 5
    )
    |> Enum.to_list()
  end
end
