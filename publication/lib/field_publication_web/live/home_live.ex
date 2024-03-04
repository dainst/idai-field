defmodule FieldPublicationWeb.HomeLive do
  use FieldPublicationWeb, :live_view

  alias FieldPublication.Projects
  alias FieldPublication.Publications

  def mount(_assigns, _session, socket) do
    published_projects =
      Projects.list()
      |> Stream.map(fn %{name: name} -> name end)
      |> Stream.map(&Publications.get_current_published(&1))
      |> Enum.reject(fn val -> val == :none end)
      |> Task.async_stream(fn publication ->
        Publications.Data.get_project_info(publication)
      end)
      |> Enum.map(fn {:ok, %{"resource" => res}} ->
        %{
          identifier: res["identifier"],
          name: Map.get(res, "shortName", res["identifier"]),
          coordinates: %{longitude: Map.get(res, "longitude"), latitude: Map.get(res, "latitude")}
        }
      end)

    features =
      Enum.map(published_projects, fn %{coordinates: coordinates, identifier: identifier} ->
        create_home_marker(coordinates, identifier)
      end)

    {:ok,
     socket
     |> assign(
       :published_projects,
       published_projects
     )
     |> assign(:highlighted, nil)
     |> assign(:features, features)}
  end

  def handle_event("home_marker_hover", project_identifier, socket) do
    socket = assign(socket, :highlighted, project_identifier)
    {:noreply, socket}
  end

  def handle_event("text_hover", project_identifier, socket) do
    socket =
      push_event(socket, "map-highlight-feature", %{feature_id: project_identifier})

    {:noreply, socket}
  end

  def handle_event("text_hover_out", _, socket) do
    socket =
      push_event(socket, "map-clear-highlights", %{})

    {:noreply, socket}
  end

  def handle_event("project_selected", %{"id" => project_identifier}, socket) do
    IO.inspect("#{project_identifier} clicked!")

    # TODO: Navigate accordingly
    {:noreply, socket}
  end

  defp create_home_marker(%{longitude: lon, latitude: lat}, id) do
    %{
      type: "Feature",
      properties: %{
        style: "homeMarker",
        hover_event: "home_marker_hover",
        click_event: "project_selected",
        id: id
      },
      geometry: %Geo.Point{
        coordinates: {lon, lat}
      }
    }
  end
end
