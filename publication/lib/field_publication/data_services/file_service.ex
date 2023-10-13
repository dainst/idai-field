defmodule FieldPublication.FileService do
  @file_store_path Application.compile_env(:field_publication, :file_store_directory_root)
  @web_images_directory Application.compile_env(:field_publication, :web_images_directory_root)

  require Logger

  def get_raw_data_path(project_name) when is_binary(project_name) do
    "#{@file_store_path}/#{project_name}/raw"
  end

  def get_web_images_path(project_name) do
    "#{@file_store_path}/#{project_name}/web_images"
  end

  def initialize(project_name) do
    [
      "#{get_raw_data_path(project_name)}/image",
      get_web_images_path(project_name)
    ]
    |> Enum.map(&File.mkdir_p/1)
  end

  def delete(project_name) do
    [
      get_raw_data_path(project_name),
      get_web_images_path(project_name)
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
    File.write!("#{get_raw_data_path(project_name)}/#{uuid}", data)
  end

  def read_raw_data(project_name, uuid, :image) do
    File.read!("#{get_raw_data_path(project_name)}/#{uuid}")
  end

  def raw_data_file_exists?(project_name, uuid, :image) do
    File.exists?("#{get_raw_data_path(project_name)}/#{uuid}")
  end

  def list_raw_data_files(project_name) do
    File.ls!(get_raw_data_path(project_name))
    |> Enum.map(fn directory ->
      {directory, File.ls!(directory)}
    end)
    |> Enum.into(%{})
  end
end
