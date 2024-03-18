defmodule FieldPublicationWeb.Presentation.IIIFComponent do
  use FieldPublicationWeb, :live_component

  @impl true
  def render(assigns) do
    ~H"""
    <div id={@id} url={@url} class={@class} phx-hook="IIIFViewer"></div>
    """
  end

  @impl true
  def update(%{id: id, project: project, uuid: uuid, class: class} = _assigns, socket) do
    url = "/api/iiif/image/iiif/3/#{project}%2F#{uuid}.jp2/info.json"

    {
      :ok,
      socket
      |> assign(:id, id)
      |> assign(url: url)
      |> assign(class: class)
    }
  end
end
