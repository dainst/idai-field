defmodule Api.Worker.Images.TilesCreator do

  require Logger
  alias Api.Worker.Images.ImageMagickImageConverter
  alias Api.Worker.Images.TilesTemplate

  @tile_size 256

  def create_tiles(project, image_id, image_size) do
    Logger.info "Start generating tiles for #{project}/#{image_id}"
    unless ImageMagickImageConverter.source_exists?(project, image_id)
    do
      Logger.warn "Cannot generate tile for '#{image_id}' of '#{project}'. Source image not found in 'sources' folder"
    else
      template = TilesTemplate.create(image_size, @tile_size)

      Logger.info "Rescale images in preparation of tile generation for #{project}/#{image_id}"
      if (rescale_images(template, project, image_id) == false) do
        Logger.error "Could not rescale all images for '#{image_id}' in preparation of tiling. Skip tile generation"
      else
        Logger.info "Generate tiles from rescaled images for #{project}/#{image_id}"
        if (generate_tiles(template, project, image_id) == true) do
          Logger.info "Successfully generated tiles for #{project}/#{image_id}"
        else
          Logger.error "Something went wrong while generating tiles for #{project}/#{image_id}"
        end
      end
    end
  end

  # Returns true if everything went fine
  defp generate_tiles(template, project, image_id) do
    (Enum.map(template,
       fn {{rescale, entries}, z} ->
         Enum.map(
           entries,
           fn entry ->
             ImageMagickImageConverter.crop(project, @tile_size, image_id, floor(rescale), z, entry)
           end
         )
       end
     )
     |> List.flatten
     |> Enum.filter(&(&1 != true))
     |> Enum.count) == 0
  end

  # Returns true if everything went fine
  defp rescale_images(template, project, image_id) do
    (Enum.map(
      template,
      fn {{rescale, _entries}, _z} ->
        ImageMagickImageConverter.rescale(project, image_id, floor(rescale))
      end
    )
    |> Enum.filter(&(&1 != true))
    |> Enum.count) == 0
  end
end
