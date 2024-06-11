defmodule FieldPublicationWeb.Publishing.ProjectFormComponent do
  use FieldPublicationWeb, :live_component

  alias FieldPublication.Schemas.Project
  alias FieldPublication.User
  alias FieldPublication.Projects

  @impl true
  def render(assigns) do
    ~H"""
    <div>
      <.header>
        <%= @title %>
      </.header>

      <.simple_form
        for={@form}
        id="project-form"
        phx-target={@myself}
        phx-change="validate"
        phx-submit="save"
      >
        <.input field={@form[:_rev]} type="hidden" />

        <%= case @action do %>
          <% :edit_project -> %>
            <h1><%= @project.name %></h1>
          <% :new_project -> %>
            <.input field={@form[:name]} type="text" label="Project key" />
          <% _ -> %>
        <% end %>
        <.checkgroup field={@form[:editors]} label="Editors" options={@users} />
        <:actions>
          <.button phx-disable-with="Saving...">Save Project</.button>
        </:actions>
      </.simple_form>
    </div>
    """
  end

  @impl true
  def update(%{project: project} = assigns, socket) do
    changeset = Project.changeset(project)

    # TODO: Extend users to show better labels. First item in tuple is used as label in the checkbox.
    users = User.list() |> Enum.map(fn %{name: name} -> {name, name} end)

    {
      :ok,
      socket
      |> assign(assigns)
      |> assign(:users, users)
      |> assign_form(changeset)
    }
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

  defp save_project(socket, :edit_project, project_params) do
    case Projects.put(socket.assigns.project, project_params) do
      {:ok, updated_project} ->
        notify_parent({:saved, updated_project})

        {
          :noreply,
          socket
          |> put_flash(:info, "Project updated successfully")
          |> push_navigate(to: ~p"/publishing")
        }

      {:error, %Ecto.Changeset{} = changeset} ->
        {:noreply, assign_form(socket, changeset)}
    end
  end

  defp save_project(socket, :new_project, project_params) do
    case Projects.put(%Project{}, project_params) do
      {:ok, created_project} ->
        notify_parent({:saved, created_project})

        {
          :noreply,
          socket
          |> put_flash(:info, "Project created successfully")
          |> push_navigate(to: ~p"/publishing")
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
