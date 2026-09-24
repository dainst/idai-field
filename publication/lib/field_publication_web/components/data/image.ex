defmodule FieldPublicationWeb.Components.Data.Image do
  use FieldPublicationWeb, :html

  @default_region "full"
  @default_width 500
  @default_size "^#{@default_width},"
  @default_rotation "0"
  @default_quality "default"
  @default_format :webp

  attr(:project, :string, required: true)
  attr(:uuid, :string, required: true)
  attr(:region, :string, default: @default_region)
  attr(:size, :string, default: @default_size)
  attr(:rotation, :string, default: @default_rotation)
  attr(:quality, :string, default: @default_quality)
  attr(:format, :atom, values: [:jpg, :png, :webp], default: @default_format)
  attr(:rest, :global)
  attr(:alt, :string)

  def img_element(assigns) do
    ~H"""
    <img
      {@rest}
      loading="lazy"
      alt={@alt}
      src={construct_url(@project, @uuid, @region, @size, @rotation, @quality, @format)}
    />
    """
  end

  def construct_url(
        project_identifier,
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

    identifier = FieldPublicationWeb.Api.IIIFImage.combine_to_identifier(project_identifier, uuid)

    "/api/iiif/image/v3/#{identifier}/#{region}/#{size}/#{rotation}/#{quality}.#{format}"
  end

  attr(:project, :string, required: true)
  attr(:uuid, :string, required: true)
  attr(:rest, :global)

  def iiif_viewer(assigns) do
    ~H"""
    <!-- Added phx-update ignore to keep rendered image when phones javascript reconnects after the tab was minimized.
    this might cause issues if we ever implement an iiif-viewer to iiif-viewer `patch` navigation.
    -->
    <div
      phx-update="ignore"
      url={construct_iiif_info_url(@project, @uuid)}
      {@rest}
      phx-hook="IIIFViewer"
    >
    </div>
    """
  end

  def construct_iiif_info_url(project_identifier, uuid) do
    ~p"/api/iiif/image/v3/#{FieldPublicationWeb.Api.IIIFImage.combine_to_identifier(project_identifier, uuid)}/info.json"
  end

  def get_default_width(), do: @default_width
  def get_default_format(), do: @default_format
end
