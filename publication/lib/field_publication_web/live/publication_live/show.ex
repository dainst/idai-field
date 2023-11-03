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

    web_images_processing? =
      publication
      |> Processing.show()
      |> Enum.any?(fn {_task_ref, type, _publication_id} ->
        type == :web_images
      end)

    {
      :ok,
      socket
      |> assign(:today, Date.utc_today())
      |> assign(:channel, channel)
      |> assign(:page_title, "Publication for '#{project_id}' drafted #{draft_date_string}.")
      |> assign(:publication, publication)
      |> assign(:last_replication_log, List.last(publication.replication_logs))
      |> assign(:replication_progress, nil)
      |> assign(:data_evaluations_done, false)
      |> assign(:web_image_processing_progress, nil)
      |> assign(:missing_raw_image_files, nil)
      |> assign(:reload_raw_files, false)
      |> assign(:web_images_processing?, web_images_processing?)
    }
  end

  @impl true
  def handle_params(_params, _url, socket) do
    {:noreply, socket}
  end

  @impl true
  def handle_event(
        "start_web_images_processing",
        _,
        %{assigns: %{publication: publication}} = socket
      ) do
    Processing.start(publication, :web_images)

    {:noreply, socket}
  end

  def handle_event(
        "stop_web_images_processing",
        _,
        %{assigns: %{publication: publication}} = socket
      ) do
    Processing.stop(publication, :web_images)

    {:noreply, socket}
  end

  def handle_event(
        "publication_date_selected",
        %{"publication-date" => date_string},
        %{assigns: %{publication: publication}} = socket
      ) do
    {:ok, updated_publication} =
      Publications.put(publication, %{"publication_date" => date_string})

    {:noreply, assign(socket, :publication, updated_publication)}
  end

  @impl true
  def handle_info(
        :run_evaluations,
        %{assigns: %{publication: %Publication{replication_finished: nil}}} = socket
      ) do
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
      |> assign(:data_evaluations_done, true)
      |> assign(:web_image_processing_progress, web_image_processing_progress)
      |> assign(:missing_raw_image_files, missing_raw_image_files)
    }
  end

  def handle_info({:replication_log, %LogEntry{} = log_entry}, socket) do
    # Only the last replication log is displayed in the interface, we just replace the previous assign.
    {:noreply, assign(socket, :last_replication_log, log_entry)}
  end

  def handle_info({source, %{counter: counter, overall: overall}}, socket)
      when source in [:file_replication_count, :document_replication_count] and
             counter == overall do
    # Document and file replication share the same interface element, using the same assign.
    # Once either is finished, the corresponding progress bar is being hidden by setting the
    # state variable back to nil.
    {:noreply, assign(socket, :replication_progress_state, nil)}
  end

  def handle_info({source, state}, socket)
      when source in [:file_replication_count, :document_replication_count] do
    # Document and file replication share the same interface element, using the same assign.
    state = Map.put(state, :percentage, state.counter / state.overall * 100)
    {:noreply, assign(socket, :replication_progress_state, state)}
  end

  def handle_info({:web_image_processing_count, state}, socket) do
    #
    state = Map.put(state, :percentage, state.counter / state.overall * 100)

    {:noreply, assign(socket, :web_image_processing_progress, state)}
  end

  def handle_info({:replication_result, publication}, socket) do
    Process.send(self(), :run_evaluations, [])

    {
      :noreply,
      socket
      |> assign(:publication, publication)
    }
  end

  def handle_info({:processing_started, :web_images}, socket) do
    {
      :noreply,
      assign(socket, :web_images_processing?, true)
    }
  end

  def handle_info({:processing_stopped, :web_images}, socket) do
    {
      :noreply,
      assign(socket, :web_images_processing?, false)
    }
  end
end
