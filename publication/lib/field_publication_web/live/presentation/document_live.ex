defmodule FieldPublicationWeb.Presentation.DocumentLive do
  use FieldPublicationWeb, :live_view

  alias FieldPublication.Projects

  alias FieldPublication.DatabaseSchema.Publication

  alias FieldPublication.Publications
  alias FieldPublication.Publications.Data
  alias FieldPublication.Publications.Data.Document

  alias FieldPublicationWeb.Presentation.Opengraph

  alias FieldPublicationWeb.Presentation.Components.PublicationSelection

  import FieldPublicationWeb.Components.Data.DocumentLink

  defmodule UnknownPublicationDocumentError do
    defexception [:message, plug_status: 404]
  end

  def mount(%{"project_identifier" => project_identifier}, _session, socket) do
    publications =
      project_identifier
      |> Publications.list()
      |> Stream.reject(fn %Publication{} = publication ->
        publication.replication_finished == nil
      end)
      |> Enum.filter(fn %Publication{} = publication ->
        Projects.has_publication_access?(publication, socket.assigns.current_user)
      end)

    draft_dates =
      Enum.map(publications, fn %Publication{} = publication ->
        Date.to_iso8601(publication.draft_date)
      end)

    {
      :ok,
      socket
      |> assign(:project_identifier, project_identifier)
      |> assign(:publications, publications)
      |> assign(:draft_dates, draft_dates)
    }
  end

  def handle_params(
        %{"draft_date" => date} = parameters,
        _uri,
        %{assigns: %{publications: publications}} = socket
      ) do
    publication =
      Enum.find(publications, fn pub ->
        Date.to_iso8601(pub.draft_date) == date
      end)

    socket =
      parameters
      |> Map.get("uuid", "project")
      |> Publications.Data.get_extended_document(publication, true)
      |> case do
        {:error, :not_found} ->
          raise UnknownPublicationDocumentError,
            message:
              "No document with id `#{Map.get(parameters, "uuid")}` for publication of project `#{publication.project_identifier}` on #{publication.draft_date}."

        %Document{id: uuid} = document ->
          project_map_layers = Publications.Data.get_project_map_layers(publication)
          image_categories = Publications.Data.get_image_categories(publication)

          socket
          |> assign(:publication, publication)
          |> assign(:uuid, uuid)
          |> assign(:doc, document)
          |> assign(:image_categories, image_categories)
          |> assign(:project_map_layers, project_map_layers)
          |> assign(
            :page_title,
            get_page_title(document)
          )
          |> Opengraph.add_opengraph_tags(publication, document)
      end

    {:noreply, socket}
  end

  def handle_params(
        _no_date_was_requested,
        _uri,
        %{assigns: %{publications: publications, project_identifier: project_identifier}} = socket
      ) do
    # This handles the case where we were only handed a project name parameter. The mount/2 above will have already
    # evaluated the project name and its published publications. We select the newest publication (first in list) and
    # the first language as defined in that publication's document and patch the URL.
    # The patch will then get handled by another handle_params/3 above.

    publication = List.last(publications)

    {
      :noreply,
      socket
      |> assign(:publication, publication)
      |> push_patch(
        to: ~p"/projects/#{project_identifier}/#{publication.draft_date}",
        replace: true
      )
    }
  end

  def handle_event(
        "search",
        %{"search_input" => q},
        %{
          assigns: %{
            publication: %Publication{
              project_identifier: project_identifier,
              draft_date: draft_date
            }
          }
        } = socket
      ) do
    {
      :noreply,
      redirect(socket,
        to: ~p"/projects/search/#{project_identifier}/#{draft_date}?#{%{q: q}}"
      )
    }
  end

  def handle_info(
        {:drawn_selection, geometry},
        %{
          assigns: %{
            publication: %Publication{
              project_identifier: project_identifier,
              draft_date: draft_date
            }
          }
        } = socket
      ) do
    query =
      FieldPublicationWeb.Presentation.PublicationSearch.drawn_selection_to_parameter(geometry)

    {
      :noreply,
      push_navigate(socket, to: ~p"/projects/search/#{project_identifier}/#{draft_date}?#{query}")
    }
  end

  defp get_page_title(%Document{id: "project", identifier: identifier} = doc) do
    pick_default_translation(Data.get_field_value(doc, "shortName") || identifier)
  end

  defp get_page_title(%Document{identifier: identifier, category: %{labels: labels}}) do
    "#{identifier} (#{pick_default_translation(labels)})"
  end
end
