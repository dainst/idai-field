defmodule FieldPublicationWeb.PublicationLive.Management do
  use FieldPublicationWeb, :live_view

  alias FieldPublication.Projects
  alias FieldPublication.Projects.Project
  alias FieldPublication.Worker.Replicator.Parameters


  import Ecto.Changeset

  def render(assigns) do
    ~H"""
    <div>
      <h1>Creating new publication for <i><%= @project.id %></i></h1>

      <.simple_form
        for={@form}
        id="replication-form"
        phx-change="validate"
        phx-submit="replicate"
      >
        <.input field={@form[:source_url]} type="text" label="Source URL" />
        <.input field={@form[:source_project_name]} type="text" label="Source project name" />
        <.input field={@form[:source_user]} type="text" label="Source user name" />
        <.input field={@form[:source_password]} type="text" label="Source user password" />
        <.input field={@form[:local_project_name]} type="hidden" />
        <:actions>
          <.button phx-disable-with="Initializing...">Start replication</.button>
        </:actions>
      </.simple_form>
    </div>
    """
  end

  @impl true
  def mount(%{"project_id" => project_id}, session, socket) do
    {
      :ok,
      socket
      |> assign(:project, Projects.get_project!(project_id))
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
        local_project_name: project.id
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

  def handle_event("replicate", %{"parameters" => replication_params}, socket) do
    socket =
      replication_params
      |> Parameters.create()
      |> case do
        {:error, changeset} ->
          socket
          |> assign(:form, to_form(changeset))
        {:ok, parameters} ->
          IO.inspect(parameters)

          FieldPublication.Worker.Replicator.replicate(parameters)
          |> case do
            {:error, :invalid_domain} ->
              changeset =
                parameters
                |> Parameters.changeset()
                |> add_error(:source_url, "The URL seems to be invalid.")
                |> Map.put(:action, :validate)

              assign(socket, :form, to_form(changeset))
            _ ->
              socket
          end
    end
    {:noreply, socket |> IO.inspect()}
  end

end
