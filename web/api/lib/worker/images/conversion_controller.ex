defmodule Api.Worker.Images.ConversionController do

  require Logger
  import Api.Worker.Images.ImageMagickImageConverter

  defp log_start_project(project) do
    Logger.info "Start image conversion for '#{project}'"
  end

  def convert(project) do
    log_start_project project
    if sources_exist? project do
      convert_files project
    else
      Logger.error "Sources do not exist for '#{project}'"
    end
    { :finished, project }
  end
end
