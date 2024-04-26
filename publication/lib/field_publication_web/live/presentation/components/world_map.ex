defmodule FieldPublicationWeb.Presentation.Components.WorldMap do
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
      phx-hook="WorldMap"
    >
    </div>
    """
  end

  @impl true
  def update(%{id: id, projects: projects} = assigns, socket) do
    assigns = set_defaults(assigns)

    features =
      projects
      |> Enum.map(fn doc ->
        case doc do
          %{coordinates: coordinates, name: name} ->
            create_home_marker(coordinates, name)

          _ ->
            nil
        end
      end)
      |> Enum.reject(fn val -> is_nil(val) end)

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

  defp create_home_marker(%{longitude: lon, latitude: lat}, project_name) do
    %{
      type: "Feature",
      properties: %{
        style: "homeMarker",
        hover_event: "home_marker_hover",
        click_event: "project_selected",
        id: project_name
      },
      geometry: %Geo.Point{
        coordinates: {lon, lat}
      }
    }
  end
end
