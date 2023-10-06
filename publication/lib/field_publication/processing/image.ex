defmodule FieldPublication.Processing.Image do
  alias Phoenix.PubSub

  alias FieldPublication.FileService
  alias FieldPublication.Schemas.{
    Publication
  }

  @web_images_directory Application.compile_env(:field_publication, :web_images_directory_root)
  @filestore_root Application.compile_env(:field_publication, :file_store_directory_root)
  @dev_mode Application.compile_env(:field_publication, :dev_routes)

  def evaluate_unprocessed_images(project_id, publication_date) do
    {:ok, raw_files} = FileService.list_publication_files(project_id, publication_date)

    processed_files =
      project_id
      |> get_publication_dir(publication_date)
      |> File.ls()
      |> case do
        {:ok, list} ->
          list
          |> Enum.map(fn file_name -> String.replace_suffix(file_name, ".jp2", "") end)

        _ ->
          []
      end

    counter = Enum.count(processed_files)
    overall = Enum.count(raw_files)

    %{overall: overall, counter: counter, percentage: counter / overall * 100}
  end


  @dialyzer {:nowarn_function, create_web_view_images: 1}
  def create_web_view_images(%{publication: %Publication{project_name: project_key, draft_date: draft_date}, channel: channel}) do
    {:ok, source_files} = FileService.list_publication_files(project_key, draft_date)

    current_state = evaluate_unprocessed_images(project_key, draft_date)

    {:ok, counter_pid} =
      Agent.start_link(fn -> current_state end)

    target_folder = get_publication_dir(project_key, draft_date)

    create_target_directory(target_folder)

    source_directory = FileService.get_publication_path(project_key, draft_date)

    source_files
    |> Stream.map(fn source_file ->
      {"#{source_directory}/#{source_file}", "#{target_folder}/#{Path.basename(source_file)}.jp2"}
    end)
    |> Enum.map(&convert_file(&1, counter_pid, channel))
  end

  @dialyzer {:nowarn_function, create_target_directory: 1}
  defp create_target_directory(target_path) do
    if @dev_mode do
      target_path = String.replace(target_path, "#{@web_images_directory}/", "")

      System.cmd(
        "docker",
        [
          "exec",
          "field_publication_cantaloupe",
          "mkdir",
          "-p",
          "/image_root/#{target_path}"
        ]
      )
    else
      File.mkdir_p!(target_path)
    end
  end

  @dialyzer {:nowarn_function, convert_file: 3}
  defp convert_file({input_file_path, target_file_path}, counter_pid, channel) do
    if @dev_mode do
      input_file_path = String.replace(input_file_path, "#{@filestore_root}/", "")
      target_file_path = String.replace(target_file_path, "#{@web_images_directory}/", "")

      System.cmd(
        "docker",
        [
          "exec",
          "field_publication_cantaloupe",
          "convert",
          "/source_images/#{input_file_path}",
          "/image_root/#{target_file_path}"
        ]
      )
    else
      System.cmd("convert", [input_file_path, target_file_path])
    end

    Agent.update(counter_pid, fn state -> Map.put(state, :counter, state[:counter] + 1) end)

    PubSub.broadcast(
      FieldPublication.PubSub,
      channel,
      {
        :web_image_processing,
        Agent.get(counter_pid, fn state -> state end)
      }
    )
  end

  defp get_publication_dir(project_id, publication_name) do
    "#{@web_images_directory}/#{project_id}/#{publication_name}"
  end
end
