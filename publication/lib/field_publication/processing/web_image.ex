defmodule FieldPublication.Processing.WebImage do
  alias Phoenix.PubSub

  alias Vix.Vips.{
    Image,
    Operation
  }

  alias FieldPublication.FileService
  alias FieldPublication.Publications

  alias FieldPublication.DatabaseSchema.{
    Publication
  }

  require Logger

  @moduledoc """
  This module contains functions for creating JPEG2000 images from raw image data to be served
  by the external [Canaloupe](https://cantaloupe-project.github.io) IIIF server application.
  """

  def evaluate_web_images_state(%Publication{project_name: project_name} = publication) do
    %{image: current_raw_files} = FileService.list_raw_data_files(project_name)

    current_web_files = FileService.list_web_image_files(project_name)

    image_categories =
      Publications.Data.get_all_subcategories(publication, "Image")

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

  def start(%Publication{project_name: project_name} = publication) do
    %{existing_raw_files: existing_raw_files, summary: summary} =
      evaluate_web_images_state(publication)

    raw_root = FileService.get_raw_data_path(project_name)
    web_root = FileService.get_web_images_path(project_name)

    # TODO: Log missing raw files

    {:ok, counter_pid} =
      Agent.start_link(fn -> summary end)

    doc_id = Publications.get_doc_id(publication)

    existing_raw_files
    |> Enum.map(fn uuid ->
      Logger.debug(
        "Creating web image (pyramid TIFF) for '#{uuid}' in project '#{publication.project_name}'..."
      )

      {:ok, file} = Image.new_from_file("#{raw_root}/image/#{uuid}")

      # Apply exif rotation metadata directly to the image data (if present), because we do not
      # want end user's web browser to rotate image tiles because of the metadata.
      {:ok, {file, _}} = Operation.autorot(file)

      :ok =
        Operation.tiffsave(file, "#{web_root}/#{uuid}.tif",
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

      PubSub.broadcast(
        FieldPublication.PubSub,
        doc_id,
        {
          :web_image_processing_count,
          updated_state
        }
      )
    end)
    |> Enum.to_list()
  end
end
