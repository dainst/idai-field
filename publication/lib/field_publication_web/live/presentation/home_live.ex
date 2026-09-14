defmodule FieldPublicationWeb.Presentation.HomeLive do
  use FieldPublicationWeb, :live_view

  alias FieldPublication.Publication

  alias FieldPublication.Publication.{
    Document
  }

  def mount(_assigns, _session, socket) do
    published_projects =
      Enum.map(
        Publication.get_current_published(),
        fn %Publication{project_identifier: project_identifier} = publication ->
          doc = Publication.get_extended_document("project", publication)

          longitude =
            Document.get_field_value(
              doc,
              "longitude"
            )

          latitude =
            Document.get_field_value(
              doc,
              "latitude"
            )

          metadata = %{
            name: project_identifier,
            doc: doc
          }

          if !is_nil(latitude) and !is_nil(longitude) do
            Map.put(metadata, :coordinates, %{longitude: longitude, latitude: latitude})
          else
            metadata
          end
        end
      )

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

  def handle_event("project_selected", %{"id" => project_identifier}, socket) do
    socket = push_navigate(socket, to: ~p"/projects/#{project_identifier}")

    {:noreply, socket}
  end
end
