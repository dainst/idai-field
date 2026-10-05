defmodule FieldPublicationWeb.Presentation.HomeLive do
  use FieldPublicationWeb, :live_view

  alias FieldPublication.{
    EmbeddedSchema.Translation,
    Publication,
    User
  }

  attr :publication, Publication, required: true
  attr :highlighted?, :boolean, default: false

  def publication_link(assigns) do
    ~H"""
    <div
      id={"project_list_#{@publication.project_identifier}"}
      phx-hook="HoverHighlightMapFeature"
      target_dom_element="project_overview_map"
      target_id={@publication.project_identifier}
    >
      <!-- The custom hook above triggers the marker highlight on the map component below when hovering this element. -->
      <!-- In parallel to the hook above, phx-click and phx-value-* below implement the click behaviour
        with standard liveview attributes. -->
      <.link navigate={~p"/projects/#{@publication.project_identifier}"}>
        <div
          class={"rounded #{if @highlighted? do "bg-primary-hover text-primary-inverse-hover" else "bg-primary text-primary-inverse" end}  p-2 mt-2 cursor-pointer"}
          phx-value-id={@publication.project_identifier}
        >
          <div class="text-center">
            <%= case @publication.project_label do %>
              <% [] -> %>
                {@publication.project_identifier}
              <% translations -> %>
                <% translations =
                  Enum.map(translations, fn %Translation{language: lang, text: text} ->
                    {lang, text}
                  end)
                  |> Enum.into(%{}) %>

                {pick_default_translation(translations)}
            <% end %>
          </div>
        </div>
      </.link>
    </div>
    """
  end

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
