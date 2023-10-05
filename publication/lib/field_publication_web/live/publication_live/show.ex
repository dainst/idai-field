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
    publication = Publication.get!(project_id, draft_date_string)
    PubSub.subscribe(FieldPublication.PubSub, Publication.get_doc_id(publication))

    {
      :ok,
      socket
      |> assign(:page_title, "Publication for '#{project_id}' drafted #{draft_date_string}.")
      |> assign(:publication, publication)
      |> assign(:last_replication_log, List.last(publication.replication_logs))
      |> assign(:replication_progress_state, nil)
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

  def handle_info({:replication_log, %LogEntry{} = log_entry}, socket) do
    {
      :noreply,
      socket
      |> assign(:last_replication_log, log_entry)
    }
  end


  def handle_info({source, %{counter: counter, overall: overall}}, socket) when source in [:file_processing, :document_processing] and
      counter == overall do
    {:noreply, assign(socket, :replication_progress_state, nil)}
  end

  def handle_info({source, state}, socket) when source in [:file_processing, :document_processing] do
    {:noreply,
     assign(
       socket,
       :replication_progress_state,
       Map.put(state, :percentage, state.counter / state.overall * 100)
     )}
  end

  def handle_info({:replication_result, publication}, socket) do
    {
      :noreply,
      socket
      |> assign(:publication, publication)
    }
  end
end
