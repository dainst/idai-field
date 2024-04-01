defmodule FieldPublicationWeb.Presentation.DocumentLive do
  use FieldPublicationWeb, :live_view

  alias FieldPublication.Publications
  alias FieldPublication.Publications.Data

  alias FieldPublicationWeb.Presentation.Components.{
    ProjectDocument,
    GenericDocument,
    ImageDocument
  }

  def mount(%{"project_id" => project_name}, _session, socket) do
    publications =
      project_name
      |> Publications.list()
      |> Enum.filter(fn pub -> pub.publication_date != nil end)

    publication_dates =
      Enum.map(publications, fn pub ->
        Date.to_iso8601(pub.publication_date)
      end)

    {
      :ok,
      socket
      |> assign(:project_name, project_name)
      |> assign(:publications, publications)
      |> assign(:publication_dates, publication_dates)
    }
  end

  def handle_params(
        %{"publication_date" => date, "language" => language, "uuid" => uuid},
        _uri,
        %{assigns: %{publications: publications}} = socket
      ) do
    # Display the document corresponding to the provided UUID.

    current_publication =
      Enum.find(publications, fn pub ->
        Date.to_iso8601(pub.publication_date) == date
      end)

    doc = Publications.Data.get_document(uuid, current_publication)

    image_categories = Publications.Data.get_all_subcategories(current_publication, "Image")

    {
      :noreply,
      socket
      |> assign(:doc, doc)
      |> assign(:publication, current_publication)
      |> assign(:selected_lang, language)
      |> assign(:uuid, uuid)
      |> assign(:image_categories, image_categories)
    }
  end

  def handle_params(
        %{"publication_date" => date, "language" => language},
        _uri,
        %{assigns: %{publications: publications}} = socket
      ) do
    # No was UUID provided, display the project document for the selected publication.

    current_publication =
      Enum.find(publications, fn pub ->
        Date.to_iso8601(pub.publication_date) == date
      end)

    project_doc = Publications.Data.get_document("project", current_publication)

    {
      :noreply,
      socket
      |> assign(:doc, project_doc)
      |> assign(:publication, current_publication)
      |> assign(:selected_lang, language)
      |> assign(:uuid, "")
    }
  end

  def handle_params(
        _neither_date_nor_language_specified,
        _uri,
        %{assigns: %{publications: publications, project_name: project_name}} = socket
      ) do
    # This handles the case where we were only handed a project name parameter. The mount/2 above will have already
    # evaluated the project name and its published publications. We select the newest publication (first in list) and
    # the first language as defined in that publication's document and patch the URL.
    # The patch will then get handled by another handle_params/3 above.

    publication = List.last(publications)

    language =
      if Gettext.get_locale(FieldPublicationWeb.Gettext) in publication.languages do
        Gettext.get_locale(FieldPublicationWeb.Gettext)
      else
        List.first(publication.languages)
      end

    {
      :noreply,
      socket
      |> assign(:publication, publication)
      |> push_patch(to: ~p"/#{project_name}/#{publication.publication_date}/#{language}")
    }
  end

  def handle_event(
        "project_options_changed",
        %{"_target" => ["project_language_selection"], "project_language_selection" => lang},
        %{assigns: %{project_name: project_name, publication: publication}} = socket
      ) do
    uuid = Map.get(socket.assigns, :uuid, "")

    {
      :noreply,
      push_patch(socket, to: ~p"/#{project_name}/#{publication.publication_date}/#{lang}/#{uuid}")
    }
  end

  def handle_event(
        "project_options_changed",
        %{"_target" => ["project_date_selection"], "project_date_selection" => date},
        %{assigns: %{project_name: project_name, selected_lang: lang}} = socket
      ) do
    uuid = Map.get(socket.assigns, :uuid, "")

    {
      :noreply,
      push_patch(socket, to: ~p"/#{project_name}/#{date}/#{lang}/#{uuid}")
    }
  end
end
