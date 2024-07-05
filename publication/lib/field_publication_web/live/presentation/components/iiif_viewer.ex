defmodule FieldPublicationWeb.Presentation.Components.IIIFViewer do
  use FieldPublicationWeb, :live_component

  @impl true
  def render(assigns) do
    ~H"""
    <div id={@id} url={@url} class={@class} phx-hook="IIIFViewer"></div>
    """
  end

  @impl true
  def update(%{project: project, uuid: uuid} = assigns, socket) do
    url = construct_url(project, uuid)

    class = Map.get(assigns, :class, "")

    {
      :ok,
      socket
      |> assign(assigns)
      |> assign(:class, class)
      |> assign(:url, url)
    }
  end

  def construct_url(project, uuid), do: "/api/image/iiif/3/#{project}%2F#{uuid}.jp2/info.json"
end
