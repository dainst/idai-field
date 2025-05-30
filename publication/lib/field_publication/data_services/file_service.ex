defmodule FieldPublication.FileService do
  @file_store_path Application.compile_env(:field_publication, :file_store_directory_root)
  @admin_upload_dir "admin_uploads"
  @logo_path "#{@file_store_path}/#{@admin_upload_dir}/logos"
  require Logger

  @moduledoc """
  This module handles interaction with data served from the application's file system. This is
  currently means all image data variants.
  """
  def initial_setup() do
    File.mkdir_p!(@logo_path)
  end

  def logo_path() do
    @logo_path
  end

  def list_uploaded_logos() do
    @logo_path
    |> File.ls!()
    |> Enum.map(fn file_name -> {file_name, "#{@logo_path}/#{file_name}"} end)
  end

  def store_logo(input_path, target_file_name) do
    target_path = "#{@logo_path}/#{target_file_name}"

    if File.exists?(target_path) do
      {:error, :exists}
    else
      File.cp(input_path, target_path)
    end
  end

  def delete_logo(file_name) do
    "#{@logo_path}/#{file_name}"
    |> IO.inspect()
    |> File.rm()
  end

  def get_raw_data_path(project_name) when is_binary(project_name) do
    "#{@file_store_path}/raw/#{project_name}"
  end

  def get_raw_image_data_path(project_name) when is_binary(project_name) do
    "#{get_raw_data_path(project_name)}/image"
  end

  def get_web_images_path(project_name) do
    "#{@file_store_path}/web_images/#{project_name}"
  end

  def get_map_tiles_path(project_name) do
    "#{@file_store_path}/map_tiles/#{project_name}"
  end

  def initialize!(project_name) do
    [
      get_raw_image_data_path(project_name),
      get_web_images_path(project_name),
      get_map_tiles_path(project_name)
    ]
    |> Enum.map(&File.mkdir_p!/1)
  end

  def create_map_tiles_subdirectory(project_name, uuid, z_index, x_index) do
    path = "#{get_map_tiles_path(project_name)}/#{uuid}/#{z_index}/#{x_index}"
    File.mkdir_p!(path)
  end

  def delete(project_name) do
    [
      get_raw_data_path(project_name),
      get_web_images_path(project_name),
      get_map_tiles_path(project_name)
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

  def write_raw_data(project_name, uuid, data, :image) do
    File.write!("#{get_raw_data_path(project_name)}/image/#{uuid}", data)
  end

  def read_raw_data(project_name, uuid, :image) do
    File.read!("#{get_raw_data_path(project_name)}/image/#{uuid}")
  end

  def raw_data_file_exists?(project_name, uuid, :image) do
    File.exists?("#{get_raw_data_path(project_name)}/image/#{uuid}")
  end

  def list_raw_data_files(project_name) do
    File.ls!(get_raw_data_path(project_name))
    |> Enum.map(fn directory ->
      {String.to_existing_atom(directory),
       File.ls!("#{get_raw_data_path(project_name)}/#{directory}")}
    end)
    |> Enum.into(%{})
  end

  def list_web_image_files(project_name) do
    File.ls!(get_web_images_path(project_name))
  end

  def list_tile_image_directories(project_name) do
    File.ls!(get_map_tiles_path(project_name))
  end
end
