defmodule FieldPublicationWeb.Presentation.HomeLive do
  use FieldPublicationWeb, :live_view

  alias FieldPublication.Projects
  alias FieldPublication.Publications
  alias FieldPublication.Schemas.Publication

  alias FieldPublication.Publications.Data

  alias FieldPublicationWeb.Presentation.Components.{
    I18n
  }

  def mount(_assigns, _session, socket) do
    published_projects =
      Projects.list()
      |> Stream.map(fn %{name: name} -> name end)
      |> Stream.map(&Publications.get_current_published(&1))
      |> Enum.reject(fn val -> val == :none end)
      |> Task.async_stream(fn publication ->
        {publication, Publications.Data.get_project_info(publication)}
      end)
      |> Enum.map(fn {:ok, {%Publication{project_name: project_name}, doc}} ->
        %{
          name: project_name,
          doc: doc,
          coordinates: %{
            longitude:
              Data.get_field_values(
                doc,
                "longitude"
              ),
            latitude:
              Data.get_field_values(
                doc,
                "latitude"
              )
          }
        }
      end)

    features =
      Enum.map(
        published_projects,
        fn %{coordinates: coordinates, name: name} ->
          create_home_marker(coordinates, name)
        end
      )

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
    {:noreply, push_navigate(socket, to: "/#{project_identifier}")}
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
