defmodule FieldPublicationWeb.Presentation.HomeLive do
  use FieldPublicationWeb, :live_view

  alias FieldPublication.Publications
  alias FieldPublication.DatabaseSchema.Publication

  alias FieldPublication.Publications.Data
  alias FieldPublication.Publications.Data.Document

  import FieldPublicationWeb.Components.Data.Field

  require Logger

  def mount(_assigns, _session, socket) do
    published_projects =
      Publications.get_most_recent(:all, socket.assigns.current_user)
      |> Task.async_stream(fn %Publication{} = publication ->
        {publication, Publications.Data.get_extended_document("project", publication)}
      end)
      |> Enum.map(fn
        {:ok, {%Publication{} = pub, %Document{} = doc}} ->
          create_metadata(pub, doc)
        {:ok, {%Publication{} = pub, _} } ->
          Logger.error("Failed to load project document for '#{Publications.get_doc_id(pub)}'.")
          :error
      end)
      |> Enum.reject(fn val -> val == :error end)

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

  def handle_event("project_selected", %{"id" => project_name}, socket) do
    socket = push_navigate(socket, to: ~p"/projects/#{project_name}")

    {:noreply, socket}
  end

  defp create_metadata(%Publication{project_name: project_name}, %Document{} = doc) do
    longitude =
    Data.get_field_value(
      doc,
      "longitude"
    )

  latitude =
    Data.get_field_value(
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
  end
end
