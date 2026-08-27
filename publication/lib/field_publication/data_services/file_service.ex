defmodule FieldPublication.FileService do
  alias FieldPublication.DatabaseSchema.Publication

  @file_store_path Application.compile_env(:field_publication, :file_store_directory_root)
  @custom_assets_path "#{@file_store_path}/custom_assets/"
  @custom_images_path "#{@custom_assets_path}/images"

  @moduledoc """
  This module handles interaction with data served from the application's file system. This is
  currently means all image data variants.
  """
  def initial_setup() do
    File.mkdir_p!("#{@custom_assets_path}/images")
  end

  def custom_assets_path(), do: @custom_assets_path

  def list_uploaded_logos() do
    @custom_images_path
    |> File.ls!()
    |> Enum.map(fn file_name -> {file_name, "#{@custom_images_path}/#{file_name}"} end)
  end

  def store_admin_image_upload(input_path, target_file_name) do
    target_path = "#{@custom_images_path}/#{target_file_name}"

    if File.exists?(target_path) do
      {:error, :exists}
    else
      File.cp(input_path, target_path)
    end
  end

  def delete_admin_image_upload(file_name) do
    "#{@custom_images_path}/#{file_name}"
    |> File.rm()
  end

  def get_raw_data_path(project_identifier) when is_binary(project_identifier) do
    "#{@file_store_path}/raw/#{project_identifier}"
  end

  def get_raw_image_data_path(project_identifier) when is_binary(project_identifier) do
    "#{get_raw_data_path(project_identifier)}/image"
  end

  def get_raw_image_data_path(project_identifier, uuid)
      when is_binary(project_identifier) and is_binary(uuid) do
    "#{get_raw_image_data_path(project_identifier)}/#{uuid}"
  end

  def get_web_images_path(project_identifier) do
    "#{@file_store_path}/web_images/#{project_identifier}"
  end

  def get_web_images_path(project_identifier, uuid) do
    "#{get_web_images_path(project_identifier)}/#{uuid}.tif"
  end

  def get_iiif_cache_path(project_identifier) when is_binary(project_identifier) do
    Path.join([
      @file_store_path,
      "iiif_cache",
      project_identifier
    ])
  end

  def get_map_tiles_base_path(project_identifier) do
    "#{@file_store_path}/map_tiles/#{project_identifier}"
  end

  def get_map_tiles_base_path(project_identifier, uuid) do
    "#{get_map_tiles_base_path(project_identifier)}/#{uuid}"
  end

  def initialize!(project_identifier) do
    [
      get_raw_image_data_path(project_identifier),
      get_web_images_path(project_identifier),
      get_map_tiles_base_path(project_identifier)
    ]
    |> Enum.map(&File.mkdir_p!/1)
  end

  def create_map_tiles_subdirectory(project_identifier, uuid, z_index, x_index) do
    path = "#{get_map_tiles_base_path(project_identifier)}/#{uuid}/#{z_index}/#{x_index}"
    File.mkdir_p!(path)
  end

  def delete(project_identifier) do
    [
      get_raw_data_path(project_identifier),
      get_web_images_path(project_identifier),
      get_map_tiles_base_path(project_identifier)
    ]
    |> Enum.map(&File.rm_rf/1)
    |> Enum.reduce_while([], fn result, acc ->
      case result do
        {:error, _, _} = error ->
          {:halt, error}

        {:ok, path_list} ->
          {:cont, acc ++ path_list}
      end
    end)
    |> case do
      {:error, _, _} = error ->
        error

      path_list ->
        {:ok, path_list}
    end
  end

  def write_raw_data(project_identifier, uuid, data, :image) do
    File.write!("#{get_raw_data_path(project_identifier)}/image/#{uuid}", data)
  end

  def read_raw_data(project_identifier, uuid, :image) do
    File.read!("#{get_raw_data_path(project_identifier)}/image/#{uuid}")
  end

  def raw_data_file_exists?(project_identifier, uuid, :image) do
    File.exists?("#{get_raw_data_path(project_identifier)}/image/#{uuid}")
  end

  def list_raw_data_files(project_identifier) do
    File.ls!(get_raw_data_path(project_identifier))
    |> Enum.map(fn directory ->
      {String.to_existing_atom(directory),
       File.ls!("#{get_raw_data_path(project_identifier)}/#{directory}")}
    end)
    |> Enum.into(%{})
  end

  def list_web_image_files(project_identifier) do
    File.ls!(get_web_images_path(project_identifier))
  end

  def list_tile_image_directories(project_identifier) do
    File.ls!(get_map_tiles_base_path(project_identifier))
  end

  def write_preprocessed_geo_vector_data(
        %Publication{} = publication,
        collections,
        epsg
      ) do
    base_path = preprocessed_geometry_path(publication)

    collections_metadata =
      Enum.map(collections, fn %{properties: %{category: category} = collection_metadata} =
                                 collection ->
        content = JSON.encode!(collection)

        base_file = "#{category}.geojson"
        temp_file = "#{base_file}_tmp"

        original_directory_path =
          Path.join([
            base_path,
            if epsg do
              "EPSG_#{epsg}"
            else
              "custom"
            end
          ])

        File.mkdir_p!(original_directory_path)

        original_base_file = Path.join([original_directory_path, base_file])

        temp_file_path =
          Path.join(
            base_path,
            temp_file
          )

        if epsg do
          File.write!(temp_file_path, content)
          input_crs = "EPSG:#{epsg}"

          # Hacky way to make sure the crs property is set in FeatureCollection:
          System.cmd(
            "gdal",
            [
              "vector",
              "reproject",
              "--input-crs",
              input_crs,
              "--output-crs",
              input_crs,
              "-q",
              "--overwrite",
              temp_file_path,
              original_base_file
            ],
            stderr_to_stdout: true
          )
          |> case do
            {_, 0} ->
              :ok

            {msg, code} ->
              raise "Unable to create geometry collection `#{category}` for #{publication.project_identifier}/#{publication.draft_date}, gdal returned code #{code} with #{inspect(msg)}"
          end

          if epsg != 4326 do
            epsg_4326_directory_path = Path.join([base_path, "EPSG_4326"])
            File.mkdir_p!(epsg_4326_directory_path)

            epsg_4326_base_file = Path.join([epsg_4326_directory_path, base_file])

            System.cmd(
              "gdal",
              [
                "vector",
                "reproject",
                "--input-crs",
                input_crs,
                "--output-crs",
                "EPSG:4326",
                "-q",
                "--overwrite",
                temp_file_path,
                epsg_4326_base_file
              ],
              stderr_to_stdout: true
            )
            |> case do
              {_, 0} ->
                :ok

              {msg, code} ->
                raise "Unable to create geometry collection `#{category}` for #{publication.project_identifier}/#{publication.draft_date}, gdal returned code #{code} with #{inspect(msg)}"
            end

            content = File.read!(epsg_4326_base_file)

            # The JSON generated by gdal has quite some whitespace, re-encode it to make sure it is as small as possible even without the other compressions.
            File.write!(epsg_4326_base_file, Jason.decode!(content) |> Jason.encode!())
            File.write!("#{epsg_4326_base_file}.gz", content |> :zlib.gzip())
            File.write!("#{epsg_4326_base_file}.br", content |> ExBrotli.compress!())
          end

          File.rm(temp_file_path)
        else
          File.write!(original_base_file, content)
        end

        content = File.read!(original_base_file)

        File.write!(original_base_file, Jason.decode!(content) |> Jason.encode!())

        File.write!("#{original_base_file}.gz", content |> :zlib.gzip())
        File.write!("#{original_base_file}.br", content |> ExBrotli.compress!())

        {category, collection_metadata}
      end)
      |> Enum.into(%{})

    File.write(Path.join(base_path, "info.json"), Jason.encode!(collections_metadata))
  end

  def write_geometry_collections(
        %Publication{} = publication,
        collection
      ) do
    path = publication_geometry_path(publication)
    compressed_path = publication_geometry_path(publication, true)

    with :ok <- path |> Path.dirname() |> File.mkdir_p(),
         :ok <- compressed_path |> Path.dirname() |> File.mkdir_p() do
      content = JSON.encode!(collection)

      File.write!(path, content)
      File.write!(compressed_path, content |> ExBrotli.compress!())

      %{
        json: path,
        compressed: compressed_path
      }
    else
      error ->
        error
    end
  end

  def delete_geometry_collections(%Publication{} = publication) do
    %{
      json:
        publication
        |> publication_geometry_path()
        |> File.rm(),
      compressed:
        publication
        |> publication_geometry_path()
        |> File.rm()
    }
  end

  def preprocessed_geometry_path(%Publication{
        project_identifier: project_identifier,
        draft_date: draft_date
      }) do
    Path.join([
      @file_store_path,
      "map_vector_features",
      project_identifier,
      Date.to_string(draft_date)
    ])
  end

  def publication_geometry_path(%Publication{} = publication, compressed? \\ false) do
    Path.join([
      preprocessed_json(publication),
      "geo_collections.json#{if compressed?, do: ".br"}"
    ])
  end

  def write_hierarchy(
        %Publication{} = publication,
        hierarchy
      ) do
    path = publication_hierarchy_path(publication)

    with :ok <- path |> Path.dirname() |> File.mkdir_p() do
      content = JSON.encode!(hierarchy)

      File.write(path, content)
    else
      error ->
        error
    end
  end

  def delete_hierarchy(%Publication{} = publication) do
    publication
    |> publication_hierarchy_path()
    |> File.rm()
  end

  def publication_hierarchy_path(%Publication{} = publication) do
    Path.join([
      preprocessed_json(publication),
      "hierarchy.json"
    ])
  end

  defp preprocessed_json(%Publication{
         project_identifier: project_identifier,
         draft_date: draft_date
       }) do
    Path.join([
      @file_store_path,
      "json",
      project_identifier,
      Date.to_string(draft_date)
    ])
  end
end
