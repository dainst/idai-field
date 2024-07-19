defmodule FieldPublicationWeb.Presentation.Components.Image do
  use Phoenix.Component

  attr :project, :string, required: true
  attr :uuid, :string, required: true
  attr :class, :string, default: ""
  attr :alt_text, :string, default: ""
  attr :region, :string
  attr :size, :string
  attr :rotation, :string
  attr :quality, :string

  def show(assigns) do
    ~H"""
    <img class={@class} alt={@alt_text} src={construct_url(assigns)} />
    """
  end

  def construct_url(%{project: project, uuid: uuid} = assigns) do
    region = Map.get(assigns, :region, "full")
    # scales the image down or up to 500px width by default
    size =
      assigns
      |> Map.get(:size, "^500,")
      |> String.replace("^", "%5E")

    rotation = Map.get(assigns, :rotation, "0")
    quality = Map.get(assigns, :quality, "default")

    "/api/image/iiif/3/#{project}%2F#{uuid}.jp2/#{region}/#{size}/#{rotation}/#{quality}.jpg"
  end
end
