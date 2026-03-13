defmodule FieldPublicationWeb.Presentation.DocumentLive do
  alias FieldPublication.Publications.Search
  use FieldPublicationWeb, :live_view

  alias FieldPublication.Projects

  alias FieldPublication.DatabaseSchema.Publication

  alias FieldPublication.Publications
  alias FieldPublication.Publications.Data
  alias FieldPublication.Publications.Data.Document

  alias FieldPublicationWeb.Presentation.Opengraph

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
      |> assign(:focus, :default)
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
      |> evaluate_requested_doc(current_publication, params)
      |> assign(:focus, parse_focus(Map.get(params, "focus")))
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

    {
      :noreply,
      socket
      |> assign(:publication, publication)
      |> push_patch(
        to: ~p"/projects/#{project_name}/#{publication.draft_date}",
        replace: true
      )
    }
  end

  def handle_event(
        "geometry-clicked",
        %{"uuid" => uuid},
        %{assigns: %{publication: publication, focus: focus}} = socket
      ) do
    query_params =
      case focus do
        :map ->
          %{focus: "map"}

        _ ->
          %{}
      end

    {
      :noreply,
      push_patch(socket,
        to:
          ~p"/projects/#{publication.project_name}/#{publication.draft_date}/#{uuid}?#{query_params}"
      )
    }
  end

  def handle_event(
        "search",
        %{"search_input" => q},
        %{assigns: %{publication: %Publication{project_name: project_name}}} = socket
      ) do
    {
      :noreply,
      redirect(socket, to: ~p"/search?#{%{q: q, filters: %{project_key: project_name}}}")
    }
  end

  defp get_page_title(%Document{id: "project"} = doc) do
    pick_default_translation(Data.get_field_value(doc, "shortName"))
  end

  defp get_page_title(%Document{identifier: identifier, category: %{labels: labels}}) do
    "#{identifier} (#{pick_default_translation(labels)})"
  end

  defp evaluate_requested_doc(
         socket,
         %Publication{} = publication,
         %{"uuid" => uuid}
       )
       when uuid != "project" do
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
        image_categories = Publications.Data.get_image_categories(publication)

        ancestors =
          publication
          |> Publications.get_hierarchy()
          |> construct_ancestor_tree(uuid, [])
          |> Data.get_preview_documents(publication)

        socket
        |> assign(:uuid, uuid)
        |> assign(:doc, extended_doc)
        |> assign(:image_categories, image_categories)
        |> assign(:ancestors, ancestors)
        |> assign(:project_map_layers, project_map_layers)
        |> assign(
          :page_title,
          get_page_title(extended_doc)
        )
        |> Opengraph.add_opengraph_tags(publication, extended_doc)
    end
  end

  defp evaluate_requested_doc(
         socket,
         %Publication{} = publication,
         _params
       ) do
    # If no UUID was provided, load the publication's extended "project" document.
    project_doc = Publications.Data.get_extended_document("project", publication, true)

    top_level_uuids =
      Publications.get_hierarchy(publication)
      |> Enum.filter(fn {_key, values} ->
        Map.get(values, "parent") == nil
      end)
      |> Enum.map(fn {key, _values} ->
        key
      end)

    top_level_docs = Data.get_preview_documents(top_level_uuids, publication)

    category_hierarchy = Data.get_category_hierarchy(publication)
    category_usage = Search.get_category_count(publication)

    socket
    |> assign(:doc, project_doc)
    |> assign(:publication, publication)
    |> assign(:top_level_docs, top_level_docs)
    |> assign(:category_hierarchy, category_hierarchy)
    |> assign(:category_usage, category_usage)
    |> assign(
      :page_title,
      get_page_title(project_doc)
    )
    |> assign(:uuid, "")
  end

  defp parse_focus("map"), do: :map
  defp parse_focus(_), do: :default

  defp construct_ancestor_tree(hierarchy, id, children) do
    Map.get(hierarchy, id, %{})
    |> case do
      %{"parent" => nil} ->
        children

      %{"parent" => parent_id} ->
        construct_ancestor_tree(hierarchy, parent_id, [parent_id] ++ children)

      _ ->
        children
    end
  end
end
