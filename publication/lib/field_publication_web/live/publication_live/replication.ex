defmodule FieldPublicationWeb.PublicationLive.Replication do
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

  @log_cache Application.get_env(:field_publication, :replication_log_cache_name)

  require Logger

  @impl true
  def render(assigns) do
    ~H"""
    <div>
      <h1 class="text-4xl font-extrabold">Create publication draft for <i><%= @project.id %></i></h1>

      <div class="flex flex-row mt-5">
        <div class="relative items-center block p-2 basis-3/5">
          <.simple_form for={@form} id="replication-form" phx-change="validate" phx-submit="start">
            <div class="flex flex-row">
              <div class="p-11">
                <h2 class="text-2xl">Publication data</h2>
                <div
                  :if={@initialization_error}
                  class="border-red-800 bg-red-200 p-2 border-2 rounded"
                >
                  <%= @initialization_error %>
                </div>
                <.input field={@form[:source_url]} type="url" label="Source URL" />
                <.input field={@form[:source_project_name]} type="text" label="Source project name" />
                <.input field={@form[:source_user]} type="text" label="Source user name" />
                <.input field={@form[:source_password]} type="password" label="Source user password" />
                <.input field={@form[:project_key]} type="hidden" />
                <div class="pt-5">
                  <.input
                    field={@form[:delete_existing_publication]}
                    type="checkbox"
                    label="Delete existing publication"
                  />
                </div>
              </div>

              <div class="p-11 border-l-2 border-black">
                <h2 class="text-2xl">Publication comments</h2>
                <.live_component
                  module={FieldPublicationWeb.TranslationLive.FormComponent}
                  id={@form[:comments]}
                  form_field={@form[:comments]}
                  add="add_comment"
                  remove="remove_comment"
                />
              </div>
            </div>

            <:actions>
              <.button phx-disable-with="Initializing...">Start replication</.button>
            </:actions>
          </.simple_form>
          <!-- Overlay while replication is running -->
          <div
            :if={@replication_running}
            class="bg-black/80 w-full h-full rounded-l-lg z-10 absolute top-0 left-0"
          >
            <div role="status" class="absolute -translate-x-1/2 -translate-y-1/2 top-2/4 left-1/2">
              <svg
                aria-hidden="true"
                class="w-8 h-8 mr-2 animate-spin dark:text-slate-300 fill-indigo-500"
                viewBox="0 0 100 101"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
                  fill="currentColor"
                /><path
                  d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
                  fill="currentFill"
                />
              </svg>
            </div>
          </div>
          <!-- End of overlay. -->
        </div>
        <div class="border-l-4 border-indigo-500 rounded-r-lg basis-2/5 bg-slate-100">
          <LogComponent.list logs={@replication_logs} />
          <div :if={@file_replication_status} class="p-2">
            <ProgressBarComponent.display status={@file_replication_status} />
          </div>
          <div :if={@document_replication_status} class="p-2">
            <ProgressBarComponent.display status={@document_replication_status} />
          </div>
        </div>
      </div>
      <.back navigate={~p"/edit/#{@project.id}"}>Back to project</.back>
    </div>
    """
  end

  @impl true
  def mount(%{"project_id" => project_id}, _session, socket) do
    replication_channel = "replication-#{project_id}"

    running_process_logs =
      Cachex.get(@log_cache, replication_channel)
      |> case do
        {:ok, nil} ->
          []

        {:ok, entries} ->
          entries
      end

    project = Project.get_project!(project_id)

    PubSub.subscribe(FieldPublication.PubSub, replication_channel)

    changeset =
      %Parameters{}
      |> Parameters.changeset(%{
        source_project_name: project.id,
        source_user: project.id,
        project_key: project.id,
        comments: []
      })

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
      |> assign(:form, to_form(changeset))
    }
  end

  @impl true
  def handle_params(params, _url, socket) do
    {:noreply, socket}
  end

  @impl true
  def handle_event("validate", %{"parameters" => replication_params}, socket) do
    changeset =
      %Parameters{}
      |> Parameters.changeset(replication_params)
      |> Map.put(:action, :validate)

    {
      :noreply,
      socket
      |> assign(:initialization_error, nil)
      |> assign(:form, to_form(changeset))
    }
  end

  @impl true
  def handle_event("add_comment", _, %{assigns: %{form: %{source: changeset}}} = socket) do
    current_comments = Ecto.Changeset.get_field(changeset, :comments)

    changeset =
      Ecto.Changeset.put_embed(
        changeset,
        :comments,
        current_comments ++ [%{text: "", language: ""}]
      )

    {
      :noreply,
      socket
      |> assign(:form, to_form(changeset))
    }
  end

  @impl true
  def handle_event(
        "remove_comment",
        %{"id" => "parameters_comments_" <> id},
        %{assigns: %{form: %{source: changeset}}} = socket
      ) do
    {index, _remainder} = Integer.parse(id)

    updated_comments =
      changeset
      |> Ecto.Changeset.get_field(:comments)
      |> List.delete_at(index)

    changeset =
      changeset
      |> Ecto.Changeset.put_embed(:comments, updated_comments)

    {
      :noreply,
      socket
      |> assign(:form, to_form(changeset))
    }
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
          |> case do
            {:ok, :started} ->
              socket
              |> assign(:replication_running, true)
              |> assign(:replication_logs, [])

            {:error, msg} ->
              socket
              |> assign(:initialization_error, msg)
          end
      end

    {:noreply, socket}
  end

  @impl true
  def handle_info(
        {:replication_log, %LogEntry{} = log_entry},
        %{assigns: %{replication_logs: existing_entries}} = socket
      ) do
    socket =
      socket
      |> assign(:replication_logs, existing_entries ++ [log_entry])

    {:noreply, socket}
  end

  def handle_info({:replication_result, {:error, _error}}, socket) do
    socket =
      socket
      |> assign(:replication_running, false)
      |> put_flash(:info, "Error while creating draft.")

    {:noreply, socket}
  end

  def handle_info({:replication_result, {:ok, _report}}, %{assigns: %{project: project}} = socket) do
    socket =
      socket
      |> put_flash(:info, "Draft successfully created")
      |> push_navigate(to: "/edit/#{project.id}")

    {:noreply, socket}
  end

  def handle_info({:file_processing, %{counter: counter, overall: overall}}, socket)
      when counter == overall do
    {:noreply, assign(socket, :file_replication_status, nil)}
  end

  def handle_info({:file_processing, state}, socket) do
    {:noreply,
     assign(
       socket,
       :file_replication_status,
       Map.put(state, :percentage, state.counter / state.overall * 100)
     )}
  end

  def handle_info({:document_processing, %{counter: counter, overall: overall}}, socket)
      when counter == overall do
    {:noreply, assign(socket, :document_replication_status, nil)}
  end

  def handle_info({:document_processing, state}, socket) do
    {:noreply,
     assign(
       socket,
       :document_replication_status,
       Map.put(state, :percentage, state.counter / state.overall * 100)
     )}
  end
end
