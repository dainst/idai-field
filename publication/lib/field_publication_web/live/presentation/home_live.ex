defmodule FieldPublicationWeb.Presentation.HomeLive do
  use FieldPublicationWeb, :live_view

  alias FieldPublication.{
    EmbeddedSchema.Translation,
    Publication,
    Publication.Document,
    User
  }

  def mount(_assigns, _session, socket) do
    publications = Publication.get_current_published()

    {
      :ok,
      socket
      |> assign(
        :publications,
        publications
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
