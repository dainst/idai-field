defmodule FieldPublicationWeb.PublicationLive.Show do
  alias FieldPublication.Processing.Image
  use FieldPublicationWeb, :live_view

  alias Phoenix.PubSub

  alias FieldPublication.Publications
  alias FieldPublication.Replication

  alias FieldPublication.Schemas.{
    Publication,
    LogEntry
  }

  alias FieldPublication.Processing

  require Logger

  @impl true
  def mount(%{"project_id" => project_id, "draft_date" => draft_date_string}, _session, socket) do
    publication = Publications.get!(project_id, draft_date_string)
    channel = Publications.get_doc_id(publication)

    PubSub.subscribe(FieldPublication.PubSub, channel)

    if publication.replication_finished do
      start_data_state_evaluation(publication)
    end

    # Check if web images are currently processed for the publication.
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
      |> assign(:replication_logs, publication.replication_logs)
      |> assign(:replication_progress_state, nil)
      |> assign(:data_state, nil)
      |> assign(:web_images_processing?, web_images_processing?)
    }
  end

  @impl true
  def handle_params(_params, _url, socket) do
    {:noreply, socket}
  end

  @impl true
  @doc """
  The function `handle_event/3` reacts to events (clicks and input changes) coming from the user's browser.
  """
  def handle_event("stop_replication", _, %{assigns: %{publication: publication}} = socket) do
    # The Replication module will broadcast a message to all connected users that will get picked up by
    # a handle_info/2 function defined below.
    Replication.stop(publication)

    {:noreply, socket}
  end

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
        "publication_version_selected",
        %{"publication-version" => new_version},
        %{assigns: %{publication: publication}} = socket
      ) do
    {:ok, updated_publication} =
      Publications.put(publication, %{"version" => new_version})

    {:noreply, assign(socket, :publication, updated_publication)}
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
  @doc """
  The function `handle_info/2` handles messages sent directly to the socket-process from the within the server application.
  """
  def handle_info({ref, {:data_state_evaluation, data_state}}, socket) do
    # Handles the result of the async Task started in the `mount/3` function above.

    # We don't care about the processes DOWN message now, so let's demonitor and flush it.
    Process.demonitor(ref, [:flush])
    {:noreply, assign(socket, :data_state, data_state)}
  end

  def handle_info(
        {:replication_log, %LogEntry{} = log_entry},
        %{assigns: %{replication_logs: previous}} = socket
      ) do
    # Append the new log to the list of existing ones.
    {:noreply, assign(socket, :replication_logs, previous ++ [log_entry])}
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

  def handle_info({:replication_stopped}, %{assigns: %{publication: publication}} = socket) do
    # Replication was stopped prematurely by a user, the publication got deleted so we redirect the connected
    # user to the parent project.
    {:noreply, push_navigate(socket, to: ~p"/edit/#{publication.project_name}")}
  end

  def handle_info({:replication_result, publication}, socket) do
    # Replication has finished, now check for data consistency and necessary processing tasks.
    start_data_state_evaluation(publication)

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

  def handle_info(
        {:web_image_processing_count, _summary},
        %{assigns: %{data_state: nil}} = socket
      ) do
    # The web image processing state an update, but we just mounted the socket and and have
    # not yet evaluated the overall data state: Ignore the progress update for now.
    # TODO: Re-evaluate a better pattern
    {:noreply, socket}
  end

  def handle_info(
        {:web_image_processing_count, summary},
        %{assigns: %{data_state: data_state}} = socket
      ) do
    updated_data_state =
      Map.update!(data_state, :images, fn old_image_state ->
        Map.put(old_image_state, :summary, summary)
      end)

    {:noreply, assign(socket, :data_state, updated_data_state)}
  end

  def handle_info({:processing_stopped, :web_images}, socket) do
    {
      :noreply,
      assign(socket, :web_images_processing?, false)
    }
  end

  def handle_info(
        {:updated_translations, "publication_comments", translations},
        %{assigns: %{publication: publication}} = socket
      ) do
    # TODO: Catch _rev error if somebody else worked on the same publication document concurrently and this update got rejected.
    {:ok, updated_publication} = Publications.update_comments(publication, translations)

    {
      :noreply,
      assign(socket, :publication, updated_publication)
    }
  end

  def get_version_options() do
    %{"Release" => :major, "Revision" => :revision}
  end

  defp start_data_state_evaluation(%Publication{} = publication) do
    # The result of the async task will get picked up by a `handle_info/2` above.
    Task.async(fn ->
      {
        :data_state_evaluation,
        %{
          images: Image.evaluate_web_images_state(publication)
        }
        # TODO: Add elastic search and tiling state evaluation.
      }
    end)
  end
end
