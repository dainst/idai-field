defmodule FieldPublicationWeb.Presentation.DocumentLive do
  alias FieldPublicationWeb.Presentation.Components.I18n
  use FieldPublicationWeb, :live_view

  alias FieldPublication.Publications
  alias FieldPublication.Publications.Data

  alias FieldPublicationWeb.Presentation.DocumentComponents
  alias FieldPublicationWeb.Presentation.Components.PublicationSelection

  def mount(%{"project_id" => project_name}, _session, socket) do
    publications =
      project_name
      |> Publications.list()
      |> Stream.filter(fn pub -> pub.publication_date != nil end)
      |> Enum.reject(fn pub -> Date.after?(pub.publication_date, Date.utc_today()) end)

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

    project_map_layers =
      Publications.Data.get_project_map_layers(current_publication)

    image_categories = Publications.Data.get_all_subcategories(current_publication, "Image")

    child_uuids =
      Publications.Data.get_hierarchy(current_publication)
      |> Enum.find(fn {key, _values} ->
        key == uuid
      end)
      |> case do
        nil ->
          # Document is not part of the hierarchy, for example images.
          []

        {_key, value} ->
          value["children"]
      end

    child_doc_previews = Data.get_doc_previews(current_publication, child_uuids)

    relations_with_geometry =
      Map.get(doc, "relations", [])
      |> Enum.map(fn %{"values" => rel_docs} ->
        rel_docs
      end)
      |> List.flatten()
      |> List.flatten(child_doc_previews)
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
      |> assign(:child_doc_previews, child_doc_previews)
      |> assign(:relations_with_geometry, relations_with_geometry)
      |> assign(:project_map_layers, project_map_layers)
      |> assign(
        :page_title,
        get_page_title(doc)
      )
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

    child_doc_previews = Data.get_doc_previews(current_publication, top_level_uuids)

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
      |> assign(:child_doc_previews, child_doc_previews)
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
        to: ~p"/#{project_name}/#{publication.publication_date}/#{language}",
        replace: true
      )
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
