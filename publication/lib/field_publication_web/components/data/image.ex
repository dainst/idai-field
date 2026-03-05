defmodule FieldPublicationWeb.Components.Data.Image do
  use Phoenix.Component

  @default_region "full"
  @default_size "^500,"
  @default_rotation "0"
  @default_quality "default"
  @default_format :jpg

  attr :project, :string, required: true
  attr :uuid, :string, required: true
  attr :region, :string, default: @default_region
  attr :size, :string, default: @default_size
  attr :rotation, :string, default: @default_rotation
  attr :quality, :string, default: @default_quality
  attr :format, :atom, values: [:jpg, :png, :webp], default: @default_format
  attr :rest, :global

  def img_element(assigns) do
    ~H"""
    <img
      {@rest}
      loading="lazy"
      src={construct_url(@project, @uuid, @region, @size, @rotation, @quality, @format)}
    />
    """
  end

  def construct_url(
        project,
        uuid,
        region \\ @default_region,
        size \\ @default_size,
        rotation \\ @default_rotation,
        quality \\ @default_quality,
        format \\ @default_format
      ) do
    # This function is also used elsewhere besides the component `img_element/1` defined above. For
    # those cases we define the default parameters again on function call. For `img_element/1` the
    # same default parameters are already set by the `:attr` definitions.
    size = String.replace(size, "^", "%5E")

    "/api/image/iiif/3/#{project}%2F#{uuid}/#{region}/#{size}/#{rotation}/#{quality}.#{format}"
  end

  attr :project, :string, required: true
  attr :uuid, :string, required: true
  attr :rest, :global

  def iiif_viewer(assigns) do
    ~H"""
    <% url = construct_iiif_info_url(@project, @uuid) %>

    <div url={url} {@rest} phx-hook="IIIFViewer"></div>
    """
  end

  def construct_iiif_info_url(project, uuid),
    do: "/api/image/iiif/3/#{project}%2F#{uuid}/info.json"
end
