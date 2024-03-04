defmodule FieldPublicationWeb.MapLiveComponent do
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
      phx-hook="OpenLayersMap"
    >
    </div>
    """
  end

  @impl true
  def update(%{id: id, features: features} = assigns, socket) do
    assigns = set_defaults(assigns)

    socket =
      socket
      |> assign(assigns)
      |> push_event("map-set-features-#{id}", %{target: id, features: features})

    {:ok, socket}
  end

  defp set_defaults(assigns) do
    assigns
    |> Map.put_new(:centerLon, 0)
    |> Map.put_new(:centerLat, 0)
    |> Map.put_new(:zoom, 2)
  end
end
