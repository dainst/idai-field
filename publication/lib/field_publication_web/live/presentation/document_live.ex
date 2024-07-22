defmodule FieldPublicationWeb.Presentation.DocumentLive do
  alias FieldPublicationWeb.Presentation.Opengraph
  alias FieldPublicationWeb.Presentation.Components.I18n
  use FieldPublicationWeb, :live_view

  alias FieldPublication.Projects

  alias FieldPublication.Publications
  alias FieldPublication.Publications.Data

  alias FieldPublicationWeb.Presentation.DocumentComponents
  alias FieldPublicationWeb.Presentation.Components.PublicationSelection

  def mount(%{"project_id" => project_name}, _session, socket) do
    publications =
      project_name
      |> Publications.list()
      |> Enum.filter(fn pub ->
        Projects.has_publication_access?(pub, socket.assigns.current_user)
      end)

    draft_dates =
      Enum.map(publications, fn pub ->
        Date.to_iso8601(pub.draft_date)
      end)

    {
      :ok,
      socket
      |> assign(:project_name, project_name)
      |> assign(:publications, publications)
      |> assign(:draft_dates, draft_dates)
    }
  end

  def handle_params(
        %{"draft_date" => date, "language" => language, "uuid" => uuid},
        _uri,
        %{assigns: %{publications: publications}} = socket
      ) do
    # Display the document corresponding to the provided UUID.

    current_publication =
      Enum.find(publications, fn pub ->
        Date.to_iso8601(pub.draft_date) == date
      end)

    doc = Publications.Data.get_extended_document(uuid, current_publication, true)

    project_map_layers =
      Publications.Data.get_project_map_layers(current_publication)

    image_categories = Publications.Data.get_all_subcategories(current_publication, "Image")

    relations_with_geometry =
      Map.get(doc, "relations", [])
      |> Enum.map(fn %{"values" => rel_docs} ->
        rel_docs
      end)
      |> List.flatten()
      |> Enum.filter(fn rel ->
        Data.get_field(rel, "geometry") != nil
      end)

    {
      :noreply,
      socket
      |> assign(:doc, doc)
      |> assign(:publication, current_publication)
      |> assign(:selected_lang, language)
      |> assign(:uuid, uuid)
      |> assign(:image_categories, image_categories)
      |> assign(:relations_with_geometry, relations_with_geometry)
      |> assign(:project_map_layers, project_map_layers)
      |> assign(
        :page_title,
        get_page_title(doc)
      )
      |> Opengraph.add_opengraph_tags(current_publication, doc, language)
    }
  end

  def handle_params(
        %{"draft_date" => date, "language" => language},
        _uri,
        %{assigns: %{publications: publications}} = socket
      ) do
    # No was UUID provided, display the project document for the selected publication.

    current_publication =
      Enum.find(publications, fn pub ->
        Date.to_iso8601(pub.draft_date) == date
      end)

    project_doc = Publications.Data.get_extended_document("project", current_publication, true)

    project_map_layers =
      Publications.Data.get_project_map_layers(current_publication)

    top_level_uuids =
      Publications.Data.get_hierarchy(current_publication)
      |> Enum.filter(fn {_key, values} ->
        Map.get(values, "parent") == nil
      end)
      |> Enum.map(fn {key, _values} ->
        key
      end)

    top_level_docs = Data.get_extended_documents(top_level_uuids, current_publication)

    publication_comments =
      current_publication.comments
      |> Enum.map(fn %{language: lang, text: text} -> {lang, text} end)
      |> Enum.into(%{})

    {
      :noreply,
      socket
      |> assign(:doc, project_doc)
      |> assign(:publication, current_publication)
      |> assign(:selected_lang, language)
      |> assign(:publication_comments, publication_comments)
      |> assign(:top_level_docs, top_level_docs)
      |> assign(:project_map_layers, project_map_layers)
      |> assign(
        :page_title,
        get_page_title(project_doc)
      )
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
      |> push_patch(
        to: ~p"/projects/#{project_name}/#{publication.draft_date}/#{language}",
        replace: true
      )
    }
  end

  def handle_event(
        "geometry-clicked",
        %{"uuid" => uuid},
        %{assigns: %{publication: publication, selected_lang: lang}} = socket
      ) do
    {
      :noreply,
      push_patch(socket,
        to: ~p"/projects/#{publication.project_name}/#{publication.draft_date}/#{lang}/#{uuid}"
      )
    }
  end

  defp get_page_title(%{"id" => "project"} = doc) do
    {_, short_description} =
      I18n.select_translation(%{values: Data.get_field_values(doc, "shortName")})

    short_description
  end

  defp get_page_title(doc) do
    short_descriptions =
      Data.get_field_values(doc, "shortDescription")
      |> case do
        nil ->
          Data.get_field_values(doc, "identifier")

        values ->
          values
      end

    {_translation_info, value} = I18n.select_translation(%{values: short_descriptions})

    value
  end
end
