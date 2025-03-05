defmodule Api.Worker.Images.ImageMagickImageConverter do
  @moduledoc """
  Encapsulates access to
  * imagemagick,
  * the filesystem, specifically the imageroot,
  * and shell commands
  """

  @im_cmd "convert"
  @imageroot "/imageroot"
  @required_imagemagick_version [6, 9]
  @required_delegates ["jp2", "png", "jpeg"]

  @intermediate_format_suffix "jpg"

  # as we want to provide it with cantaloupe
  @display_format_suffix "jp2"

  def environment_ready() do
    {version, delegates, status} = get_im_version_and_delegates()
    status == 0
    and required_version_matches(version, @required_imagemagick_version)
    and required_delegates_present(delegates)
  end

  defp img_path(project, image_id) do
    "#{@imageroot}/#{project}/#{image_id}" # todo use Path.
  end

  @doc """
  Converts all files inside the image folder for a given project (there under 'sources'),
  as they come from the 'idai-field-client',
  (which means scrambled image names without suffixes), and converts them to the format
  which is currently in use to be delivered to the 'ui' by 'cantaloupe'.
  """
  def convert_files(project) do
    project_dir = Path.join([@imageroot, project])
    sources_dir = Path.join(project_dir, "sources")

    if (not sources_exist?(project)), do: raise "Sources do not exist for '#{project}'"

    {:ok, files_and_folders} = File.ls sources_dir                             # files (and folders) in sources dir
    files_and_folders
    |> Enum.filter(&(not String.contains?(&1, ".")))                           # without file extension
    |> Enum.filter(fn file -> not File.dir?(Path.join(sources_dir, file)) end) # only files
    |> Enum.map(&(convert_file(sources_dir, project_dir, &1, @display_format_suffix)))
  end

  # Returns true if everything went fine
  defp convert_file(sources_dir, project_dir, file, display_format_suffix) do
    source_file_path = Path.absname(Path.join(sources_dir, file))
    target_file_path = Path.absname(Path.join(project_dir, [file, ".", display_format_suffix]))
    {_, status} = System.cmd(@im_cmd, [source_file_path, target_file_path])
    status == 0
  end

  def source_exists?(project, image_id) do
    File.exists?(Path.join([@imageroot, project, "sources", image_id]))
  end

  def sources_exist?(project) do
    path = Path.join([@imageroot, project, "sources"])
    File.exists?(path) and File.dir?(path)
  end

  @doc """
  Takes an image from the 'sources images directory'
  and puts it into the 'tiled directory' for that image.
  Adds a suffix.

  We convert from the original resources because it is faster than converting from jp2.

  Returns true if everything went fine
  """
  def rescale(project, image_id, rescale) do
    source_img_path = Path.absname(Path.join([@imageroot, project, "sources", image_id])) <> "[0]"
    target_dir = Path.join([@imageroot, project, image_id])
    File.mkdir_p target_dir # todo do in caller

    target_img_path = "#{img_path(project, image_id)}/#{image_id}.#{rescale}.#{@intermediate_format_suffix}"

    if File.exists? target_img_path do
      true # don't overwrite existing files
    else
      {cmd, args} = {
        @im_cmd,
        [
          source_img_path,
          "-scale", # instead -resize, to prevent cache-resources-exhausted; cranking up resource limits did not work
          "#{rescale}x#{rescale}",
          target_img_path
        ]
      }
      {_, status} = System.cmd cmd, args
      status == 0
    end
  end

  @doc """
  Returns true is everything went fine
  """
  def crop(
         project,
         tile_size,
         image_id,
         rescale,
         z_index,
         %{x_index: x_index, y_index: y_index, x_pos: x_pos, y_pos: y_pos}) do

    x_folder = Path.join(
      [
        @imageroot,
        project,
        image_id,
        Integer.to_string(z_index),
        Integer.to_string(x_index)
      ]
    )
    File.mkdir_p x_folder

    source_img_path = "#{img_path(project, image_id)}/#{image_id}.#{rescale}.#{@intermediate_format_suffix}"
    target_img_path = "#{img_path(project, image_id)}/#{z_index}/#{x_index}/#{y_index}.png"

    if File.exists? target_img_path do
      true # don't overwrite existing files
    else
      {cmd, args} = {
        @im_cmd,
        [
          source_img_path,
          "-quiet", # suppress 'convert: geometry does not contain image', some tiles simply will have no content with tiled rectangular images
          "-crop", "#{tile_size}x#{tile_size}+#{x_pos}+#{y_pos}",
          "-background", "transparent",
          "-extent", "#{tile_size}x#{tile_size}",
          target_img_path
        ]
      }
      {_, status} = System.cmd cmd, args
      status == 0
    end
  end

  defp required_version_matches(version, [required_major, required_minor]) do
    [major, minor, _] = String.split(version, ".")
    {major, _} = Integer.parse major
    {minor, _} = Integer.parse minor
    major > required_major or (major == required_major and minor >= required_minor)
  end

  defp required_delegates_present(delegates) do
    Enum.empty?(@required_delegates -- delegates)
  end

  defp get_im_version_and_delegates() do
    {result, result_status} = System.cmd(@im_cmd, ["--version"])
    lines = String.split(result, "\n")
    [delegates] = Enum.filter(lines, fn line -> String.starts_with?(line, "Delegates") end)
    [_, delegates] = String.split(delegates, ":")
    delegates = String.split(delegates)
    [version] = Enum.filter(lines, fn line -> String.starts_with?(line, "Version") end)
    [version] = Enum.filter(String.split(version), fn part -> String.match?(part, ~r/\d*\.\d\.\d/) end)
    {version, delegates, result_status}
  end
end
