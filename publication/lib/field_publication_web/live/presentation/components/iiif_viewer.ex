defmodule FieldPublicationWeb.Presentation.Components.IIIFViewer do
  use FieldPublicationWeb, :live_component

  @impl true
  def render(assigns) do
    ~H"""
    <div id={@id} url={@url} style={"height:#{@height}"} class="shadow" phx-hook="IIIFViewer"></div>
    """
  end

  @impl true
  def update(%{id: id, project: project, uuid: uuid} = assigns, socket) do
    url = construct_url(project, uuid)

    height = Map.get(assigns, :height, "50vh")

    {
      :ok,
      socket
      |> assign(:id, id)
      |> assign(:url, url)
      |> assign(:height, height)
    }
  end

  def construct_url(project, uuid), do: "/api/image/iiif/3/#{project}%2F#{uuid}.jp2/info.json"
end
