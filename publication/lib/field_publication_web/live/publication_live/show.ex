defmodule FieldPublicationWeb.PublicationLive.Show do
  use FieldPublicationWeb, :live_view

  alias Phoenix.PubSub

  alias FieldPublication.Schema.Project
  alias FieldPublication.Processing
  alias FieldPublicationWeb.PublicationLive.LogComponent

  @log_cache Application.compile_env(:field_publication, :replication_log_cache_name)

  require Logger

  @impl true
  def mount(%{"project_id" => project_id} = params, _session, socket) do
    replication_channel = "replication-#{project_id}"

    running_process_logs =
      Cachex.get(@log_cache, replication_channel)
      |> case do
        {:ok, nil} ->
          []

        {:ok, entries} ->
          entries
      end

    PubSub.subscribe(FieldPublication.PubSub, replication_channel)

    {
      :ok,
      socket
      |> assign(:page_title, "Create new publication")
      |> assign(:project, Project.get_project!(project_id))
      |> assign(:initialization_error, nil)
      |> assign(:replication_running, false)
      |> assign(:replication_log_channel, replication_channel)
      |> assign(:replication_logs, running_process_logs)
      |> assign(:document_replication_status, nil)
      |> assign(:file_replication_status, nil)
      |> apply_action(socket.assigns.live_action, params)
    }
  end

  @impl true
  def handle_params(params, _url, socket) do
    {:noreply, apply_action(socket, socket.assigns.live_action, params)}
  end

  defp apply_action(socket, :new, %{"project_id" => id}) do
    socket
    |> assign(:page_title, "New publication for '#{id}'.")
  end

  defp apply_action(socket, nil, %{"project_id" => id, "draft_date" => draft_date}) do
    publication =
      Project.find_publication_by_draft_date(
        socket.assigns.project,
        Date.from_iso8601!(draft_date)
      )

    socket
    |> assign(:page_title, "Publication for '#{id}' drafted #{draft_date}.")
    |> assign(:publication, publication)
  end

  defp apply_action(socket, :edit, %{"project_id" => id, "draft_date" => draft_date}) do
    socket
    |> assign(:page_title, "Edit publication for '#{id}' drafted #{draft_date}.")
    |> assign(:project, Project.get_project!(id))
  end

  @impl true
  def handle_event("start_processing", _, socket) do
    Processing.prepare_publication(
      socket.assigns.project.id,
      Date.to_string(socket.assigns.publication.draft_date)
    )

    {:noreply, socket}
  end
end
