defmodule FieldPublicationWeb.Management.PublicationLive do
  alias FieldPublicationWeb.Translate
  use FieldPublicationWeb, :live_view

  import FieldPublicationWeb.Components.TranslationInput

  alias Phoenix.PubSub

  alias FieldPublication.Processing.{
    MapTiles,
    WebImage
  }

  alias FieldPublication.{
    Publications,
    Replication,
    Processing
  }

  alias FieldPublication.DatabaseSchema.Publication

  require Logger

  @impl true
  def mount(%{"project_id" => project_id, "draft_date" => draft_date_string}, _session, socket) do
    %Publication{} = publication = Publications.get!(project_id, draft_date_string)

    channel = Publications.get_doc_id(publication)

    PubSub.subscribe(FieldPublication.PubSub, channel)

    if publication.replication_finished do
      start_data_state_evaluation(publication)
    end

    # Check if web images are currently processed for the publication.

    processing_tasks_running = Processing.show(publication)

    web_images_processing? =
      Enum.any?(processing_tasks_running, fn {_task_ref, type, _publication_id} ->
        type == :web_images
      end)

    tile_images_processing? =
      Enum.any?(processing_tasks_running, fn {_task_ref, type, _publication_id} ->
        type == :tile_images
      end)

    search_indexing? =
      Enum.any?(processing_tasks_running, fn {_task_ref, type, _publication_id} ->
        type == :search_index
      end)

    creating_previews? =
      Enum.any?(processing_tasks_running, fn {_task_ref, type, _publication_id} ->
        type == :preview_documents
      end)

    translation_options =
      (publication.languages ++ Translate.supported_languages())
      |> Enum.uniq()
      |> Enum.sort()

    {
      :ok,
      socket
      |> assign(:page_title, "Publication for '#{project_id}' drafted #{draft_date_string}.")
      |> assign(:translation_options, translation_options)
      |> assign(:replication_progress_state, nil)
      |> assign(:data_state, nil)
      |> assign(:web_images_processing?, web_images_processing?)
      |> assign(:tile_images_processing?, tile_images_processing?)
      |> assign(:search_indexing?, search_indexing?)
      |> assign(:creating_previews?, creating_previews?)
      |> publication_updated(publication)
      |> evaluate_replication_state()
    }
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
        "start_tile_images_processing",
        _,
        %{assigns: %{publication: publication}} = socket
      ) do
    Processing.start(publication, :tile_images)

    {:noreply, socket}
  end

  def handle_event(
        "stop_tile_images_processing",
        _,
        %{assigns: %{publication: publication}} = socket
      ) do
    Processing.stop(publication, :tile_images)

    {:noreply, socket}
  end

  def handle_event(
        "start_search_indexing",
        _,
        %{assigns: %{publication: publication}} = socket
      ) do
    Processing.start(publication, :search_index)

    {:noreply, socket}
  end

  def handle_event(
        "stop_search_indexing",
        _,
        %{assigns: %{publication: publication}} = socket
      ) do
    Processing.stop(publication, :search_index)

    {:noreply, socket}
  end

  def handle_event(
        "start_preview_creation",
        _,
        %{assigns: %{publication: publication}} = socket
      ) do
    Processing.start(publication, :preview_documents)

    {:noreply, socket}
  end

  def handle_event(
        "stop_preview_creation",
        _,
        %{assigns: %{publication: publication}} = socket
      ) do
    Processing.stop(publication, :preview_documents)

    {:noreply, socket}
  end

  def handle_event(
        "validate",
        %{"publication" => form_parameters},
        socket
      ) do
    {
      :noreply,
      assign(
        socket,
        :publication_form,
        %Publication{}
        |> Publication.changeset(form_parameters)
        |> to_form()
      )
    }
  end

  def handle_event(
        "save",
        %{"publication" => publication_form_params},
        %{assigns: %{publication: publication}} = socket
      ) do
    case Publications.put(publication, publication_form_params) do
      {:ok, _updated_publication} ->
        # The update will get broadcast via PubSub and picked up by the appropriate handle_info/2 definition
        # below, so we do not need to update the socket here.
        {
          :noreply,
          socket
        }

      {:error, changeset} ->
        {:noreply, assign(socket, :publication_form, to_form(changeset))}
    end
  end

  def handle_event("publish", _, %{assigns: %{publication: publication}} = socket) do
    Publications.put(publication, %{publication_date: Date.utc_today()})

    {
      :noreply,
      socket
    }
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

  def handle_info({:replication_stopped}, socket) do
    # Replication has finished, was stopped prematurely by a user, or crashed.

    {
      :noreply,
      evaluate_replication_state(socket)
    }
  end

  def handle_info({:processing_started, :web_images}, socket) do
    {
      :noreply,
      assign(socket, :web_images_processing?, true)
    }
  end

  def handle_info(
        {processing_feedback, _summary},
        %{assigns: %{data_state: nil}} = socket
      )
      when processing_feedback in [
             :web_image_processing_count,
             :search_index_processing_count,
             :tile_image_processing_count
           ] do
    # This handles situations, where a processing task starts sending updates, while the interface is not ready yet. While
    # our view's data_state is nil, we just ignore any incoming update and thereby waiting for start_data_state_evaluation/1 to finish.
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

  def handle_info({:processing_started, :tile_images}, socket) do
    {
      :noreply,
      assign(socket, :tile_images_processing?, true)
    }
  end

  def handle_info(
        {:tile_image_processing_count, summary},
        %{assigns: %{data_state: data_state}} = socket
      ) do
    updated_data_state =
      Map.update!(data_state, :tiles, fn old_image_state ->
        Map.put(old_image_state, :summary, summary)
      end)

    {:noreply, assign(socket, :data_state, updated_data_state)}
  end

  def handle_info({:processing_stopped, :tile_images}, socket) do
    {
      :noreply,
      assign(socket, :tile_images_processing?, false)
    }
  end

  def handle_info({:processing_started, :search_index}, socket) do
    {
      :noreply,
      assign(socket, :search_indexing?, true)
    }
  end

  def handle_info(
        {:search_index_processing_count, count},
        %{assigns: %{data_state: data_state}} = socket
      ) do
    updated_data_state =
      Map.put(data_state, :search_index, count)

    {:noreply, assign(socket, :data_state, updated_data_state)}
  end

  def handle_info({:processing_stopped, :search_index}, socket) do
    {
      :noreply,
      assign(socket, :search_indexing?, false)
    }
  end

  def handle_info({:processing_started, :preview_documents}, socket) do
    {
      :noreply,
      assign(socket, :creating_previews?, true)
    }
  end

  def handle_info(
        {:processing_stopped, :preview_documents},
        %{assigns: %{publication: publication}} = socket
      ) do
    preview_doc_state = Publications.Data.get_preview_document_state(publication)

    {
      :noreply,
      socket
      |> assign(:creating_previews?, false)
      |> update(:data_state, fn old ->
        Map.put(old, :preview_documents, preview_doc_state)
      end)
    }
  end

  def handle_info(%Publication{} = updated_publication, socket) do
    {
      :noreply,
      publication_updated(socket, updated_publication)
    }
  end

  defp start_data_state_evaluation(%Publication{} = publication) do
    # The result of the async task will get picked up by a `handle_info/2` above.
    Task.async(fn ->
      {
        :data_state_evaluation,
        %{
          images: WebImage.evaluate_web_images_state(publication),
          tiles: MapTiles.evaluate_state(publication),
          search_index: Publications.Search.evaluate_active_index_state(publication),
          preview_documents: Publications.Data.get_preview_document_state(publication)
        }
      }
    end)
  end

  defp publication_updated(
         socket,
         %Publication{} = publication
       ) do
    if Map.has_key?(socket.assigns, :publication) &&
         is_nil(socket.assigns.publication.replication_finished) &&
         !is_nil(publication.replication_finished) do
      # This publication update flipped the replication finished field from `nil` to a date, which
      # means we just finished the data replication, trigger the data state evaluation.
      start_data_state_evaluation(publication)
    end

    socket
    |> assign(:publication, publication)
    |> assign(
      :publication_form,
      publication
      |> Publication.changeset()
      |> to_form
    )
  end

  defp evaluate_replication_state(%{assigns: %{publication: publication}} = socket) do
    assign(socket, :replication_state, Replication.show(publication))
  end
end
