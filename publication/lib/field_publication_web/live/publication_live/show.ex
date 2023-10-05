defmodule FieldPublicationWeb.PublicationLive.Show do
  use FieldPublicationWeb, :live_view

  alias Phoenix.PubSub

  alias FieldPublication.Schemas.{
    Project,
    Publication,
    LogEntry
  }

  alias FieldPublication.Processing.{
    Image
  }

  @cache_name :publication_task_states

  require Logger

  @impl true
  def mount(%{"project_id" => project_id, "draft_date" => draft_date_string}, _session, socket) do
    channel = "publication_#{project_id}"

    PubSub.subscribe(FieldPublication.PubSub, channel)

    publication = Publication.get!(project_id, draft_date_string)

    {
      :ok,
      socket
      |> assign(:page_title, "Publication for '#{project_id}' drafted #{draft_date_string}.")
      |> assign(:publication, publication)
      |> assign(:channel, channel)
    }
  end

  @impl true
  def handle_params(_params, _url, socket) do
    {:noreply, socket}
  end

  @impl true
  def handle_event("start_processing", _, socket) do
    Task.Supervisor.start_child(FieldPublication.Replication.Supervisor, fn ->
      Image.process_raw_images(
        socket.assigns.project.id,
        Date.to_string(socket.assigns.publication.draft_date),
        socket.assigns.channel
      )
    end)

    {:noreply, socket}
  end

  @impl true
  def handle_info(
        {:log_update, source, %LogEntry{} = log_entry},
        %{assigns: %{project: project, publication: publication}} = socket
      ) do
    updated_publication =
      Map.update!(publication, source, fn existing_logs ->
        existing_logs ++ [log_entry]
      end)
      |> Publication.update()

    updated_project = Project.add_publication(project, updated_publication)

    {
      :noreply,
      socket
      |> assign(:project, updated_project)
      |> assign(:publication, updated_publication)
    }
  end

  def handle_info(
        {:state_update, source, %{counter: counter, overall: overall} = state},
        socket
      ) do
    state = Map.put(state, :percentage, counter / overall * 100)

    updated =
      socket.assigns.task_states
      |> Map.update(source, %{state: state}, fn task ->
        Map.put(task, :state, state)
      end)

    {:noreply, assign(socket, :task_states, updated)}
  end

  def handle_info({:task_finished, source, _error_or_success}, socket) do
    # TODO: Differentiate between error/success?
    updated =
      socket.assigns.task_states
      |> Map.delete(source)

    {:noreply, assign(socket, :task_states, updated)}
  end
end
