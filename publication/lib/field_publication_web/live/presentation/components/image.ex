defmodule FieldPublicationWeb.Presentation.Components.Image do
  use Phoenix.Component

  def show(assigns) do
    ~H"""
    <img class={Map.get(assigns, :class, "")} src={construct_url(assigns)} />
    """
  end

  defp construct_url(%{project: project, uuid: uuid} = assigns) do
    region = Map.get(assigns, :region, "full")
    # scales the image down to 500px width by default
    size =
      assigns
      |> Map.get(:size, "^500,")
      |> String.replace("^", "%5E")

    rotation = Map.get(assigns, :rotation, "0")
    quality = Map.get(assigns, :quality, "default")

    "/api/image/iiif/3/#{project}%2F#{uuid}.jp2/#{region}/#{size}/#{rotation}/#{quality}.jpg"
  end
end
