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

  def processing_state_row(assigns) do
    ~H"""
    <tr>
      <td>{@label}</td>
      <%= case @state do %>
        <% :loading -> %>
          <td>
            <div class="text-center">Loading...</div>
          </td>
          <td></td>
        <% :error -> %>
          <td>
            <div class="text-center">Error while evaluating data state.</div>
          </td>
          <td></td>
        <% %{active?: active?, progress: progress} -> %>
          <td>
            <%= cond do %>
              <% progress == nil && active? -> %>
                <div class="text-center">
                  <.icon
                    name="hero-cog-8-tooth-solid"
                    class="h-4 w-4 animate-spin-slow text-primary"
                  /> Processing...
                </div>
              <% progress == nil && !active? -> %>
                <div class="text-center">
                  <.icon name="hero-check-solid" />
                </div>
              <% true -> %>
                <.progress_bar
                  count={progress.counter}
                  max={progress.overall}
                />
            <% end %>
          </td>
          <td class="text-center">
            <%= if active? do %>
              <.link
                class="font-semibold font-mono cursor-pointer"
                type="button"
                phx-click="stop_processing"
                phx-value-type={@type}
              >
                Stop
              </.link>
            <% else %>
              <.link
                class="font-semibold font-mono cursor-pointer"
                type="button"
                phx-click="start_processing"
                phx-value-type={@type}
              >
                Start
              </.link>
            <% end %>
          </td>
      <% end %>
    </tr>
    """
  end

  @impl true
  def mount(
        %{"project_identifier" => project_id, "draft_date" => draft_date_string},
        _session,
        socket
      ) do
    %Publication{} = publication = Publications.get!(project_id, draft_date_string)

    channel = Publications.get_doc_id(publication)

    PubSub.subscribe(FieldPublication.PubSub, channel)

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
      |> publication_updated(publication)
      |> evaluate_replication_state()
      |> get_issues()
      |> assign(:web_images, :loading)
      |> assign(:tile_images, :loading)
      |> assign(:search_index, %{
        active?: Processing.show(publication, :search_index) != nil,
        progress: Publications.Search.evaluate_active_index_state(publication)
      })
      |> assign(:preview_documents, %{
        active?: Processing.show(publication, :preview_documents) != nil,
        progress: nil
      })
      |> assign(:geo_collections, %{
        active?: Processing.show(publication, :geo_collections) != nil,
        progress: nil
      })
      |> assign(:database_indices, %{
        active?: Processing.show(publication, :database_indices) != nil,
        progress: nil
      })
      |> start_async(:web_images, fn ->
        %{summary: progress} = WebImage.evaluate_web_images_state(publication)

        %{
          active?: Processing.show(publication, :web_images) != nil,
          progress: progress
        }
      end)
      |> start_async(:tile_images, fn ->
        %{summary: progress} = MapTiles.evaluate_state(publication)

        %{
          active?: Processing.show(publication, :tile_images) != nil,
          progress: progress
        }
      end)
    }
  end

  @impl Phoenix.LiveView
  def handle_async(task_key, {:ok, state}, socket) when task_key in [:web_images, :tile_images] do
    {
      :noreply,
      socket
      |> assign(task_key, state)
      |> get_issues()
    }
  end

  def handle_async(task_key, {:exit, reason}, socket) do
    Logger.error("Async state loading for #{task_key} failed with:")
    Logger.error(inspect(reason))

    {
      :noreply,
      socket
      |> assign(task_key, :error)
      |> get_issues()
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
        "start_processing",
        %{"type" => type},
        %{assigns: %{publication: publication}} = socket
      ) do
    Processing.start(publication, String.to_existing_atom(type))
    {:noreply, socket}
  end

  def handle_event(
        "stop_processing",
        %{"type" => type},
        %{assigns: %{publication: publication}} = socket
      ) do
    Processing.stop(publication, String.to_existing_atom(type))
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

  def handle_info({_publication_id, {source, %{counter: counter, overall: overall}}}, socket)
      when source in [:file_replication_count, :document_replication_count] and
             counter == overall do
    # Document and file replication share the same interface element, using the same assign.
    # Once either is finished, the corresponding progress bar is being hidden by setting the
    # state variable back to nil.
    {:noreply, assign(socket, :replication_progress_state, nil)}
  end

  def handle_info({_publication_id, {source, state}}, socket)
      when source in [:file_replication_count, :document_replication_count] do
    # Document and file replication share the same interface element, using the same assign.
    state = Map.put(state, :percentage, state.counter / state.overall * 100)
    {:noreply, assign(socket, :replication_progress_state, state)}
  end

  def handle_info({_publication_id, {:replication_stopped}}, socket) do
    # Replication has finished, was stopped prematurely by a user, or crashed.

    {
      :noreply,
      evaluate_replication_state(socket)
    }
  end

  def handle_info(
        {_publication_id, {:processing_started, processing_type}},
        socket
      ) do
    {
      :noreply,
      update(socket, processing_type, fn previous ->
        Map.put(previous, :active?, true)
      end)
    }
  end

  def handle_info(
        {_publication_id, {:processing_stopped, processing_type}},
        socket
      ) do
    {
      :noreply,
      update(socket, processing_type, fn previous ->
        Map.put(previous, :active?, false)
      end)
    }
  end

  def handle_info(
        {_publication_id, {:processing_progress, processing_type, progress}},
        socket
      ) do
    {
      :noreply,
      assign(socket, processing_type, %{active?: true, progress: progress})
    }
  end

  def handle_info({_publication_id, %Publication{} = updated_publication}, socket) do
    {
      :noreply,
      publication_updated(socket, updated_publication)
    }
  end

  defp publication_updated(
         socket,
         %Publication{} = publication
       ) do
    socket
    |> assign(:publication, publication)
    |> assign(
      :publication_form,
      publication
      |> Publication.changeset()
      |> to_form
    )
  end

  def get_issues(%{assigns: %{publication: publication}} = socket) do
    issues =
      if publication.replication_finished do
        Publications.Data.get_grouped_issues(publication)
      else
        %{}
      end

    assign(socket, :data_issues, issues)
  end

  defp evaluate_replication_state(%{assigns: %{publication: publication}} = socket) do
    assign(socket, :replication_state, Replication.show(publication))
  end
end
