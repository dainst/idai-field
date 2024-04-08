defmodule FieldPublicationWeb.Presentation.Components.IIIFViewer do
  use FieldPublicationWeb, :live_component

  @impl true
  def render(assigns) do
    ~H"""
    <div id={@id} url={@url} style={"height:#{@height}"} phx-hook="IIIFViewer"></div>
    """
  end

  @impl true
  def update(%{id: id, project: project, uuid: uuid} = assigns, socket) do
    url = "/api/iiif/image/iiif/3/#{project}%2F#{uuid}.jp2/info.json"

    height = Map.get(assigns, :height, "500px")

    {
      :ok,
      socket
      |> assign(:id, id)
      |> assign(:url, url)
      |> assign(:height, height)
    }
  end
end
