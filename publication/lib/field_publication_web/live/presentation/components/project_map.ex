defmodule FieldPublicationWeb.Presentation.Components.ProjectMap do
  alias FieldPublication.Publications.Data
  use FieldPublicationWeb, :live_component

  @impl true
  def render(assigns) do
    ~H"""
    <div
      id={@id}
      style={@style}
      centerLon={@centerLon}
      centerLat={@centerLat}
      zoom={@zoom}
      phx-hook="ProjectMap"
    >
    </div>
    """
  end

  @impl true
  def update(%{id: id, layers: layers, publication: publication} = assigns, socket) do
    assigns = set_defaults(assigns)

    layers =
      layers
      |> Enum.map(&Data.get_document(&1, publication, true))
      |> IO.inspect()

    socket =
      socket
      |> assign(assigns)
      |> push_event("map-set-background-layers-#{id}", %{
        target: id,
        project: publication.project_name,
        layers: layers
      })

    {:ok, socket}
  end

  defp set_defaults(assigns) do
    assigns
    |> Map.put_new(:centerLon, 0)
    |> Map.put_new(:centerLat, 0)
    |> Map.put_new(:zoom, 2)
  end
end
