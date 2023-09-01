defmodule FieldPublicationWeb.PublicationLive.Management do
  use FieldPublicationWeb, :live_view

  alias FieldPublication.Schema.Project
  alias FieldPublication.Replication.{
    LogEntry,
    Parameters
  }

  alias FieldPublicationWeb.PublicationLive.{
    LogComponent,
    ProgressBarComponent
  }

  alias Phoenix.PubSub

  require Logger

  @impl true
  def render(assigns) do
    ~H"""
    <div>
      <h1 class="text-4xl font-extrabold">Setup new publication for <i><%= @project.id %></i></h1>

      <div class="flex flex-row mt-5 w-full">
        <div class="relative items-center block p-2 min-w-fit">
          <.simple_form
            for={@form}
            id="replication-form"
            phx-change="validate"
            phx-submit="start"
          >
            <div>
              <.input field={@form[:source_url]} type="url" label="Source URL" />
              <.input field={@form[:source_project_name]} type="text" label="Source project name" />
              <.input field={@form[:source_user]} type="text" label="Source user name" />
              <.input field={@form[:source_password]} type="password" label="Source user password" />
              <.input field={@form[:local_project_name]} type="hidden" />
              <div class="pt-5"><.input field={@form[:local_delete_existing]} type="checkbox" label="Delete existing publication" /></div>
            </div>
            <:actions>
              <.button phx-disable-with="Initializing...">Start replication</.button>
            </:actions>
          </.simple_form>
          <!-- Overlay while replication is running -->
          <div :if={@replication_running} class="bg-black/80 w-full h-full rounded-l-lg z-10 absolute top-0 left-0">
            <div role="status" class="absolute -translate-x-1/2 -translate-y-1/2 top-2/4 left-1/2">
              <svg aria-hidden="true" class="w-8 h-8 mr-2 animate-spin dark:text-gray-300 fill-indigo-500" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor"/><path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentFill"/></svg>
            </div>
          </div>
          <!-- End of overlay. -->
        </div>
        <div class="border-l-4 border-indigo-500 rounded-r-lg basis-full bg-gray-200">
          <LogComponent.list logs={@replication_logs} />
          <div :if={@file_replication_status} class="p-2">
            <ProgressBarComponent.display status={@file_replication_status} />
          </div>
          <div :if={@document_replication_status} class="p-2">
            <ProgressBarComponent.display status={@document_replication_status} />
          </div>
        </div>
      </div>
    </div>
    """
  end

  @impl true
  def mount(%{"project_id" => project_id}, _session, socket) do

    replication_channel = "replication-#{project_id}"
    PubSub.subscribe(FieldPublication.PubSub, replication_channel)

    {
      :ok,
      socket
      |> assign(:project, Project.get_project!(project_id))
      |> assign(:replication_running, false)
      |> assign(:replication_log_channel, replication_channel)
      |> assign(:replication_logs, [])
      |> assign(:document_replication_status, nil)
      |> assign(:file_replication_status, nil)
    }
  end

  @impl true
  def handle_params(params, _url, socket) do
    {:noreply, apply_action(socket, socket.assigns.live_action, params)}
  end

  defp apply_action(%{assigns: %{project: project}} = socket, :new, _params) do

    changeset =
      %Parameters{}
      |> Parameters.changeset(%{
        local_project_name: project.id,
        source_url: "http://localhost:4000",
        source_project_name: project.id,
        source_user: project.id,
        source_password: "sync_test"
      })

    socket
    |> assign(:page_title, "Create new publication")
    |> assign(:form, to_form(changeset))
  end

  @impl true
  def handle_event("validate", %{"parameters" => replication_params}, socket) do

    changeset =
      %Parameters{}
      |> Parameters.changeset(replication_params)
      |> Map.put(:action, :validate)

    {:noreply, assign(socket, :form, to_form(changeset))}
  end

  def handle_event("start", %{"parameters" => replication_params}, socket) do
    socket =
      replication_params
      |> Parameters.create()
      |> case do
        {:error, changeset} ->
          socket
          |> assign(:form, to_form(changeset))
        {:ok, parameters} ->

          FieldPublication.Replication.start(
            parameters,
            socket.assigns.replication_log_channel
          )

          socket
          |> assign(:replication_running, true)
          |> assign(:replication_logs, [])
    end
    {:noreply, socket}
  end

  @impl true
  def handle_info({:replication_log, %LogEntry{} = log_entry}, %{assigns: %{replication_logs: existing_entries}} = socket) do
    socket =
      socket
      |> assign(:replication_logs, existing_entries ++ [log_entry])

    {:noreply, socket}
  end

  def handle_info({:replication_result, {:error, error}}, socket) do

    socket =
      socket
      |> assign(:replication_running, false)
      |> create_error_feedback(error)

    {:noreply, socket}
  end

  def handle_info({:replication_result, {:ok, report}}, socket) do

    IO.inspect(report)
    Logger.debug("Todo: Replication successful.")

    socket =
      socket
      |> assign(:replication_running, false)

    {:noreply, socket}
  end

  def handle_info({:file_processing, %{counter: counter, overall: overall}}, socket) when counter == overall do
    {:noreply, assign(socket, :file_replication_status, nil)}
  end

  def handle_info({:file_processing, state}, socket) do
    {:noreply, assign(socket, :file_replication_status, Map.put(state, :percentage, (state.counter / state.overall * 100)))}
  end

  def handle_info({:document_processing, %{counter: counter, overall: overall}}, socket) when counter == overall do
    {:noreply, assign(socket, :document_replication_status, nil)}
  end

  def handle_info({:document_processing, state}, socket) do
    {:noreply, assign(socket, :document_replication_status, Map.put(state, :percentage, (state.counter / state.overall * 100)))}
  end

  defp create_error_feedback(%{assigns: %{form: %{params: params}}} = socket, %Mint.TransportError{} = error) do
    changeset =
      %Parameters{}
      |> Parameters.changeset(params)
      |> Parameters.set_source_connection_error(error)

    assign(socket, :form, to_form(changeset))
  end

  defp create_error_feedback(%{assigns: %{form: %{params: params}}} = socket, :unauthorized) do
    changeset =
      %Parameters{}
      |> Parameters.changeset(params)
      |> Parameters.set_invalid_credentials()

    assign(socket, :form, to_form(changeset))
  end
end
