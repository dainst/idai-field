defmodule FieldPublicationWeb.Presentation.HomeLive do
  use FieldPublicationWeb, :live_view

  alias FieldPublication.Publications
  alias FieldPublication.DocumentSchema.Publication

  alias FieldPublication.Publications.Data

  alias FieldPublicationWeb.Presentation.Components.{
    I18n
  }

  require Logger

  def mount(_assigns, _session, socket) do
    published_projects =
      Publications.get_most_recent(:all, socket.assigns.current_user)
      |> Task.async_stream(fn publication ->
        {publication, Publications.Data.get_extended_document("project", publication)}
      end)
      |> Enum.map(fn {:ok, {%Publication{project_name: project_name}, doc}} ->
        longitude =
          Data.get_field_values(
            doc,
            "longitude"
          )

        latitude =
          Data.get_field_values(
            doc,
            "latitude"
          )

        metadata = %{
          name: project_name,
          doc: doc
        }

        if !is_nil(latitude) and !is_nil(longitude) do
          Map.put(metadata, :coordinates, %{longitude: longitude, latitude: latitude})
        else
          metadata
        end
      end)

    {
      :ok,
      socket
      |> assign(
        :published_projects,
        published_projects
      )
      |> assign(:highlighted, nil)
      |> assign(:search_results, %{})
      |> assign(:page_title, "Overview")
    }
  end

  def handle_event("home_marker_hover", project_identifier, socket) do
    socket = assign(socket, :highlighted, project_identifier)
    {:noreply, socket}
  end

  def handle_event("text_hover", project_identifier, socket) do
    socket = push_event(socket, "map-highlight-feature", %{feature_id: project_identifier})

    {:noreply, socket}
  end

  def handle_event("text_hover_out", _, socket) do
    socket = push_event(socket, "map-clear-highlights", %{})

    {:noreply, socket}
  end
end
