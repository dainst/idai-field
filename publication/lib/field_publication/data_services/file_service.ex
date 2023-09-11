defmodule FieldPublication.FileService do
  @root_path Application.compile_env(:field_publication, :file_store_directory_root)

  require Logger

  def get_publication_path(project_name, publication_date) do
    "#{@root_path}/#{project_name}/#{publication_date}"
  end

  def initialize_publication(project_name, publication_date) do
    get_publication_path(project_name, publication_date)
    |> File.mkdir_p!()
  end

  def delete_publication(project_name, publication_date) do
    get_publication_path(project_name, publication_date)
    |> File.rm_rf()
  end

  def write_file(project_name, publication_date, uuid, data) do
    "#{get_publication_path(project_name, publication_date)}/#{uuid}"
    |> File.write!(data)
  end

  def read_file(project_name, publication_date, uuid) do
    "#{get_publication_path(project_name, publication_date)}/#{uuid}"
    |> File.read!()
  end

  def file_exists?(project_name, publication_date, uuid) do
    "#{get_publication_path(project_name, publication_date)}/#{uuid}"
    |> File.exists?()
  end

  def list_publication_files(project_name, publication_date) do
    get_publication_path(project_name, publication_date)
    |> File.ls()
  end
end
