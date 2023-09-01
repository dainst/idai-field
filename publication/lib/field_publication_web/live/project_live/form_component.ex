defmodule FieldPublicationWeb.ProjectLive.FormComponent do
  use FieldPublicationWeb, :live_component

  alias FieldPublication.Schema.Project

  @impl true
  def render(assigns) do
    ~H"""
    <div>
      <.header>
        <%= @title %>
        <:subtitle>A project may have multiple publications.</:subtitle>
      </.header>

      <.simple_form
        for={@form}
        id="project-form"
        phx-target={@myself}
        phx-change="validate"
        phx-submit="save"
      >
        <.input field={@form[:_rev]} type="hidden" />
        <.input field={@form[:doc_type]} type="hidden" />

        <%= case @action do %>
          <% :edit -> %>
            <h1> <%=@project.id %></h1>
          <% :new -> %>
           <.input field={@form[:id]} type="text" label="Project key" />
          <% _ -> %>
        <% end %>
        <.input field={@form[:hidden]} type="checkbox" label="Hidden" />
        <%= if @publications != [] do %>
          <label>Publications</label>
          Todo
        <% end %>
        <:actions>
          <.button phx-disable-with="Saving...">Save Project</.button>
        </:actions>
      </.simple_form>
    </div>
    """
  end

  @impl true
  def update(%{project: %{publications: publications} = project} = assigns, socket) do
    changeset = Project.changeset(project)

    {:ok,
     socket
     |> assign(assigns)
     |> assign(:publications, publications)
     |> assign_form(changeset)}
  end

  @impl true
  def handle_event("validate", %{"project" => form_params}, socket) do
    changeset =
      socket.assigns.project
      |> Project.changeset(form_params)
      |> Map.put(:action, :validate)

    {:noreply, assign_form(socket, changeset)}
  end

  def handle_event("save", %{"project" => project_params}, socket) do
    save_project(socket, socket.assigns.action, project_params)
  end

  defp save_project(socket, :edit, project_params) do
    case Project.update_project(socket.assigns.project, project_params) do
      {:ok, updated_project} ->
        notify_parent({:saved, updated_project})

        {
          :noreply,
          socket
          |> put_flash(:info, "Project updated successfully")
          |> push_patch(to: socket.assigns.patch)
        }

      {:error, %Ecto.Changeset{} = changeset} ->
        {:noreply, assign_form(socket, changeset)}
    end
  end

  defp save_project(socket, :new, project_params) do
    case Project.create_project(project_params) do
      {:ok, project} ->
        notify_parent({:saved, project})
        {
          :noreply,
          socket
          |> put_flash(:info, "Project created successfully")
          |> push_patch(to: socket.assigns.patch)
        }

      {:error, %Ecto.Changeset{} = changeset} ->
        {:noreply, assign_form(socket, changeset)}
    end
  end

  defp assign_form(socket, %Ecto.Changeset{} = changeset) do
    assign(socket, :form, to_form(changeset))
  end

  defp notify_parent(msg), do: send(self(), {__MODULE__, msg})
end
