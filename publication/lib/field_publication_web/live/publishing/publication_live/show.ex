defmodule FieldPublicationWeb.Publishing.PublicationLive.Show do
  alias FieldPublication.Processing.MapTiles
  alias FieldPublication.Processing.OpenSearch
  alias FieldPublication.Processing.Image
  use FieldPublicationWeb, :live_view

  alias Phoenix.PubSub

  alias FieldPublication.Publications
  alias FieldPublication.Replication

  alias FieldPublication.Schemas.{
    Publication,
    LogEntry,
    Translation
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

    initialized_comments = initialize_comments(publication)

    publication_form =
      publication
      |> Publication.changeset(%{comments: initialized_comments})
      |> to_form

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
      |> assign(:tile_images_processing?, tile_images_processing?)
      |> assign(:search_indexing?, search_indexing?)
      |> assign(:publication_form, publication_form)
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
        "validate",
        %{
          "publication" => publication_form_parameters
        },
        %{assigns: %{publication: publication}} = socket
      ) do
    {
      :noreply,
      assign(
        socket,
        :publication_form,
        publication
        |> Publication.changeset(publication_form_parameters)
        |> to_form()
      )
    }
  end

  def handle_event(
        "validate",
        %{
          "_target" => ["publication", "version"],
          "publication" => %{"version" => new_version}
        },
        %{assigns: %{publication: publication}} = socket
      ) do
    {
      :noreply,
      assign(
        socket,
        :publication_form,
        publication
        |> Publication.changeset(%{"version" => new_version})
        |> to_form()
      )
    }
  end

  def handle_event(
        "validate",
        %{
          "_target" => ["publication", "publication_date"],
          "publication" => %{"publication_date" => date_string}
        },
        %{assigns: %{publication: publication}} = socket
      ) do
    {
      :noreply,
      assign(
        socket,
        :publication_form,
        publication
        |> Publication.changeset(%{"publication_date" => date_string})
        |> to_form()
      )
    }
  end

  def handle_event(
        "validate",
        %{
          "_target" => ["publication", "comments", _translation_index, "text"],
          "publication" => %{"comments" => comment_form_parameters}
        },
        %{assigns: %{publication: publication}} = socket
      ) do
    # Because the comment interface is implemented with inputs_for/1 Phoenix also returns an index for the
    # element that was changed. Instead of making use of this and updating a single comment within the publication,
    # we rewrite the complete list of comments. For that we discard the index information.
    comments =
      comment_form_parameters
      |> Enum.map(fn {_index, parameters} ->
        parameters
      end)

    {
      :noreply,
      assign(
        socket,
        :publication_form,
        publication
        |> Publication.changeset(%{"comments" => comments})
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
      {:ok, updated_publication} ->
        {
          :noreply,
          socket
          |> assign(:publication, updated_publication)
          |> assign(
            :publication_form,
            updated_publication
            |> Publication.changeset()
            |> to_form
          )
        }

      {:error, changeset} ->
        {:noreply, assign(socket, :publication_form, to_form(changeset))}
    end
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
    {:noreply, push_navigate(socket, to: ~p"/publishing/#{publication.project_name}")}
  end

  def handle_info({:replication_result, publication}, socket) do
    # Replication has finished, now check for data consistency and necessary processing tasks.
    start_data_state_evaluation(publication)

    # Update the form to reflect the final document revision, otherwise making changes based on an old revision will fail.
    initialized_comments = initialize_comments(publication)

    publication_form =
      publication
      |> Publication.changeset(%{comments: initialized_comments})
      |> to_form

    {
      :noreply,
      socket
      |> assign(:publication, publication)
      |> assign(:publication_form, publication_form)
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

  def get_version_options() do
    %{"Full publication" => :major, "Revision" => :revision}
  end

  defp start_data_state_evaluation(%Publication{} = publication) do
    # The result of the async task will get picked up by a `handle_info/2` above.
    Task.async(fn ->
      {
        :data_state_evaluation,
        %{
          images: Image.evaluate_web_images_state(publication),
          tiles: MapTiles.evaluate_state(publication),
          search_index: OpenSearch.evaluate_state(publication)
        }
      }
    end)
  end

  defp initialize_comments(%Publication{} = publication) do
    # If there are already comments for every project added, this simply
    # returns them as changeset parameters. For every language that is missing
    # a parameters for the language and an empty text is created.
    publication_languages = publication.languages

    Enum.map(publication_languages, fn project_lang ->
      Enum.find(publication.comments, fn %Translation{language: lang} ->
        lang == project_lang
      end)
      |> case do
        nil ->
          %{"language" => project_lang, "text" => ""}

        %Translation{language: language, text: text} ->
          %{"language" => language, "text" => text}
      end
    end)
  end
end
