defmodule FieldPublicationWeb.Presentation.HomeLive do
  alias FieldPublication.Publications.Search
  use FieldPublicationWeb, :live_view

  alias FieldPublication.Publications
  alias FieldPublication.DocumentSchema.Publication

  alias FieldPublication.Publications.Data

  alias FieldPublicationWeb.Presentation.Components.{
    I18n,
    DocumentLink
  }

  require Logger

  def mount(_assigns, _session, socket) do
    published_projects =
      Publications.get_current_published()
      |> Task.async_stream(fn publication ->
        {publication, Publications.Data.get_document("project", publication)}
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
      |> assign(:search_results, [])
      |> assign(:page_title, "Overview")
    }
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
    {:noreply, push_navigate(socket, to: ~p"/projects/#{project_identifier}")}
  end

  def handle_event("preview_search", %{"search_input" => query}, socket) do
    {
      :noreply,
      assign(
        socket,
        :search_results,
        Search.fuzzy_search(query)
      )
    }
  end

  def handle_event("open_search_view", %{"search_input" => query}, socket) do
    {
      :noreply,
      push_navigate(socket, to: ~p"/search?q=#{query}")
    }
  end
end
