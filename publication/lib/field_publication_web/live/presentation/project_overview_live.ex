defmodule FieldPublicationWeb.Presentation.ProjectOverviewLive do
  use FieldPublicationWeb, :live_view

  alias FieldPublication.Publications
  alias FieldPublicationWeb.Presentation.DocumentComponent

  def mount(
        %{"project_id" => project_name, "publication_date" => date, "language" => lang},
        _session,
        socket
      ) do
    publications =
      project_name
      |> Publications.list()
      |> Enum.filter(fn pub -> pub.publication_date != nil end)

    publication_dates =
      Enum.map(publications, fn pub ->
        Date.to_iso8601(pub.publication_date)
      end)

    publication =
      Enum.find(publications, fn pub ->
        Date.to_iso8601(pub.publication_date) == date
      end)

    project_doc = Publications.Data.get_project_info(publication)

    {
      :ok,
      socket
      |> assign(:doc, project_doc)
      |> assign(:project_name, project_name)
      |> assign(:publication, publication)
      |> assign(:publications, publications)
      |> assign(:publication_dates, publication_dates)
      |> assign(:selected_lang, lang)
    }
  end

  def mount(%{"project_id" => project_name}, _session, socket) do
    publication = Publications.get_current_published(project_name)
    first_language = List.first(publication.languages)

    {
      :ok,
      push_redirect(
        socket,
        to: "/#{project_name}/#{publication.publication_date}/#{first_language}",
        replace: true
      )
    }
  end

  def handle_params(
        %{"language" => lang, "publication_date" => date},
        _uri,
        %{assigns: %{publications: publications}} = socket
      ) do
    publication =
      Enum.find(publications, fn pub ->
        Date.to_iso8601(pub.publication_date) == date
      end)

    project_doc = Publications.Data.get_project_info(publication)

    {
      :noreply,
      socket
      |> assign(:selected_lang, lang)
      |> assign(:publication, publication)
      |> assign(:doc, project_doc)
    }
  end

  def handle_event(
        "project_options_changed",
        %{"_target" => ["project_language_selection"], "project_language_selection" => lang},
        %{assigns: %{project_name: project_name, publication: publication}} = socket
      ) do
    {
      :noreply,
      push_patch(socket, to: ~p"/#{project_name}/#{publication.publication_date}/#{lang}")
    }
  end

  def handle_event(
        "project_options_changed",
        %{"_target" => ["project_date_selection"], "project_date_selection" => date},
        %{assigns: %{project_name: project_name, selected_lang: lang}} = socket
      ) do
    {
      :noreply,
      push_patch(socket, to: ~p"/#{project_name}/#{date}/#{lang}")
    }
  end
end
