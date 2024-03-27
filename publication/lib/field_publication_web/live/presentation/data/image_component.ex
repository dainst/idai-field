defmodule FieldPublicationWeb.Presentation.Data.Image do
  use Phoenix.Component

  def show(assigns) do
    ~H"""
    <img src={construct_url(assigns)} />
    """
  end

  defp construct_url(%{project: project, uuid: uuid} = assigns) do
    region = Map.get(assigns, :region, "full")
    # scales the image down to 500px width by default
    size = Map.get(assigns, :size, "500,")
    rotation = Map.get(assigns, :rotation, "0")
    quality = Map.get(assigns, :quality, "default")

    "/api/iiif/image/iiif/3/#{project}%2F#{uuid}.jp2/#{region}/#{size}/#{rotation}/#{quality}.jpg"
  end
end