defmodule FieldPublicationWeb.Presentation.HomeLive do
  alias FieldPublication.Publications.Search
  use FieldPublicationWeb, :live_view

  alias FieldPublication.Projects
  alias FieldPublication.Publications
  alias FieldPublication.Schemas.Publication

  alias FieldPublication.Publications.Data

  alias FieldPublicationWeb.Presentation.Components.{
    I18n,
    DocumentLink
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
    }
  end

  def handle_params(%{"q" => query}, _, socket) do
    results =
      Search.general_search(query)
      |> Stream.map(fn %{publication_id: id} = result ->
        Map.put(result, :publication, Publications.get!(id))
      end)
      |> Enum.map(fn %{doc: %{"resource" => res}} = result ->
        Map.put(result, :doc, %{
          "id" => res["id"],
          "category" => res["category"],
          "groups" => res["groups"],
          "identifier" => res["identifier"]
        })
      end)

    {
      :noreply,
      socket
      |> assign(:search_results, results)
      |> assign(:current_search, query)
    }
  end

  def handle_params(_no_params, _uri, socket) do
    {:noreply, assign(socket, :current_search, "")}
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

  def handle_event("search", %{"search_input" => query}, socket) do
    {
      :noreply,
      socket
      |> push_patch(to: ~p"/?q=#{query}")
    }
  end
end
