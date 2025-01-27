defmodule FieldPublicationWeb.Presentation.DocumentLive do
  alias FieldPublicationWeb.Presentation.Opengraph
  alias FieldPublicationWeb.Presentation.Components.I18n
  use FieldPublicationWeb, :live_view

  alias FieldPublication.Projects

  alias FieldPublication.DatabaseSchema.Publication

  alias FieldPublication.Publications
  alias FieldPublication.Publications.Data
  alias FieldPublication.Publications.Data.Document

  alias FieldPublicationWeb.Presentation.DocumentComponents
  alias FieldPublicationWeb.Presentation.Components.PublicationSelection

  def mount(%{"project_id" => project_name}, _session, socket) do
    publications =
      project_name
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
      |> assign(:project_name, project_name)
      |> assign(:publications, publications)
      |> assign(:draft_dates, draft_dates)
    }
  end

  def handle_params(
        %{"draft_date" => date} = params,
        _uri,
        %{assigns: %{publications: publications}} = socket
      ) do
    %Publication{} =
      current_publication =
      Enum.find(publications, fn pub ->
        Date.to_iso8601(pub.draft_date) == date
      end)

    {
      :noreply,
      socket
      |> assign(:publication, current_publication)
      |> evaluate_requested_language(current_publication, params)
      |> evaluate_requested_doc(current_publication, params)
    }
  end

  def handle_params(
        _neither_date_nor_language_were_requested,
        _uri,
        %{assigns: %{publications: publications, project_name: project_name}} = socket
      ) do
    # This handles the case where we were only handed a project name parameter. The mount/2 above will have already
    # evaluated the project name and its published publications. We select the newest publication (first in list) and
    # the first language as defined in that publication's document and patch the URL.
    # The patch will then get handled by another handle_params/3 above.

    publication = List.last(publications)
    language = pick_default_language(publication)

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

  defp get_page_title(%Document{id: "project"} = doc) do
    {_, short_description} =
      I18n.select_translation(%{values: Data.get_field_value(doc, "shortName")})

    short_description
  end

  defp get_page_title(%Document{} = doc) do
    short_descriptions =
      Data.get_field_value(doc, "shortDescription")
      |> case do
        nil ->
          Data.get_field_value(doc, "identifier")

        val ->
          val
      end

    {_translation_info, value} = I18n.select_translation(%{values: short_descriptions})

    value
  end

  defp evaluate_requested_language(
         socket,
         %Publication{} = publication,
         %{"language" => language} = params
       )
       when is_binary(language) do
    # In cases the user switched the publication version (to one earlier or later) and the
    # previously selected language is not supported, we select a new default and patch accordingly.
    if language in publication.languages do
      assign(socket, :selected_lang, language)
    else
      default = pick_default_language(publication)

      push_patch(socket,
        to:
          ~p"/projects/#{publication.project_name}/#{publication.draft_date}/#{default}/#{Map.get(params, "uuid", "")}",
        replace: true
      )
    end
  end

  defp evaluate_requested_doc(
         %{assigns: %{selected_lang: language}} = socket,
         %Publication{} = publication,
         %{"uuid" => uuid}
       ) do
    # If a UUID was provided, load its extended document.
    uuid
    |> Publications.Data.get_extended_document(publication, true)
    |> case do
      {:error, :not_found} ->
        socket
        |> assign(:uuid, uuid)
        |> assign(:doc, :not_found)
        |> assign(:page_title, "Document not found")

      %Document{} = extended_doc ->
        project_map_layers = Publications.Data.get_project_map_layers(publication)

        image_categories = Publications.Data.get_all_subcategories(publication, "Image")

        socket
        |> assign(:uuid, uuid)
        |> assign(:doc, extended_doc)
        |> assign(:image_categories, image_categories)
        |> assign(:project_map_layers, project_map_layers)
        |> assign(
          :page_title,
          get_page_title(extended_doc)
        )
        |> Opengraph.add_opengraph_tags(publication, extended_doc, language)
    end
  end

  defp evaluate_requested_doc(
         %{assigns: %{selected_lang: _language}} = socket,
         %Publication{} = publication,
         _params
       ) do
    # If no UUID was provided, load the publication's extended "project" document.
    project_doc = Publications.Data.get_extended_document("project", publication, true)

    project_map_layers =
      Publications.Data.get_project_map_layers(publication)

    top_level_uuids =
      Publications.get_hierarchy(publication)
      |> Enum.filter(fn {_key, values} ->
        Map.get(values, "parent") == nil
      end)
      |> Enum.map(fn {key, _values} ->
        key
      end)

    top_level_docs = Data.get_extended_documents(top_level_uuids, publication)

    socket
    |> assign(:doc, project_doc)
    |> assign(:publication, publication)
    |> assign(:top_level_docs, top_level_docs)
    |> assign(:project_map_layers, project_map_layers)
    |> assign(
      :page_title,
      get_page_title(project_doc)
    )
    |> assign(:uuid, "")
  end

  defp evaluate_requested_doc(socket, _, _) do
    # If the socket does not contain :selected_lang at this point, this means the selected language was
    # unsupport by the selected publication and the url got patched. No sense in evaluating the document
    # at this point.
    socket
  end

  defp pick_default_language(%Publication{} = publication) do
    if Gettext.get_locale(FieldPublicationWeb.Gettext) in publication.languages do
      Gettext.get_locale(FieldPublicationWeb.Gettext)
    else
      List.first(publication.languages)
    end
  end
end
