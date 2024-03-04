defmodule FieldPublicationWeb.MapLiveComponent do
  use FieldPublicationWeb, :live_component

  @impl true
  def render(assigns) do
    ~H"""
    <div id={@id} style={@style} phx-hook="OpenLayersMap"></div>
    """
  end

  @impl true
  def update(%{id: id, features: features} = assigns, socket) do
    socket =
      if Map.has_key?(socket.assigns, :id) do
        # If `socket.assigns` (!) already contains the :id, then this is not the first
        # call of update/2 and we do not need to initialize the map.
        socket
      else
        init_map(socket, assigns)
      end
      |> assign(assigns)
      |> push_event("map-set-features-#{id}", %{target: id, features: features})

    {:ok, socket}
  end

  defp init_map(socket, %{id: id}) do
    push_event(socket, "map-init-#{id}", %{target: id, zoom: 2, center: [0, 0]})
  end
end
