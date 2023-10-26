defmodule FieldPublicationWeb.PublicationLive.Show do
  use FieldPublicationWeb, :live_view

  alias Phoenix.PubSub

  alias FieldPublication.Publications

  alias FieldPublication.Schemas.{
    LogEntry,
    Publication
  }

  alias FieldPublication.Processing

  require Logger

  @impl true
  def mount(%{"project_id" => project_id, "draft_date" => draft_date_string}, _session, socket) do
    publication = Publications.get!(project_id, draft_date_string)
    channel = Publications.get_doc_id(publication)

    PubSub.subscribe(FieldPublication.PubSub, channel)

    Process.send(self(), :run_evaluations, [])
    {
      :ok,
      socket
      |> assign(:channel, channel)
      |> assign(:page_title, "Publication for '#{project_id}' drafted #{draft_date_string}.")
      |> assign(:publication, publication)
      |> assign(:last_replication_log, List.last(publication.replication_logs))
      |> assign(:replication_progress_state, nil)
      |> assign(:last_web_image_processing_log, nil)
      |> assign(:web_image_processing_progress, nil)
      |> assign(:missing_raw_image_files, nil)
    }
  end

  @impl true
  def handle_params(_params, _url, socket) do
    {:noreply, socket}
  end

  @impl true
  def handle_event("process_web_images", _, socket) do
    Processing.Image.start_web_image_processing(socket.assigns.publication)

    {:noreply, socket}
  end

  @impl true
  @doc """
  This function gets scheduled on mount, put longer running evaluations here. This will ensure that
  the socket connection does not have to wait for the evaluations but is instead established quickly.
  """
  def handle_info(:run_evaluations, %{assigns: %{publication: %Publication{replication_finished: nil}}} = socket) do
    # Do not run data evaluations while the replication is still ongoing.
    {:noreply, socket}
  end

  def handle_info(:run_evaluations, %{assigns: %{publication: publication}} = socket) do

    %{
      summary: web_image_processing_progress,
      missing_raw_files: missing_raw_image_files
    } = Processing.Image.evaluate_web_images_state(publication)

    {
      :noreply,
      socket
      |> assign(:web_image_processing_progress, web_image_processing_progress)
      |> assign(:missing_raw_image_files, missing_raw_image_files)
    }
  end


  def handle_info({:replication_log, %LogEntry{} = log_entry}, socket) do
    {
      :noreply, assign(socket, :last_replication_log, log_entry)
    }
  end

  def handle_info({source, %{counter: counter, overall: overall}}, socket)
      when source in [:file_processing, :document_processing] and
             counter == overall do
    {:noreply, assign(socket, :replication_progress_state, nil)}
  end

  def handle_info({source, state}, socket)
      when source in [:file_processing, :document_processing] do
    {:noreply,
     assign(
       socket,
       :replication_progress_state,
       Map.put(state, :percentage, state.counter / state.overall * 100)
     )}
  end

  def handle_info({source, state}, socket) when source == :web_image_processing do
    {:noreply,
     assign(
       socket,
       :web_image_processing_progress,
       Map.put(state, :percentage, state.counter / state.overall * 100)
     )}
  end

  def handle_info({:replication_result, publication}, socket) do

    Process.send(self(), :run_evaluations, [])

    {
      :noreply,
      socket
      |> assign(:publication, publication)
    }
  end
end
