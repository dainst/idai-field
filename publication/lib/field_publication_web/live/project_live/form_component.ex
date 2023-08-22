defmodule FieldPublicationWeb.ProjectLive.FormComponent do
  use FieldPublicationWeb, :live_component

  alias FieldPublication.Projects

  @impl true
  def render(assigns) do
    ~H"""
    <div>
      <.header>
        <%= @title %>
        <:subtitle>Use this form to manage project records in your database.</:subtitle>
      </.header>

      <.simple_form
        for={@form}
        id="project-form"
        phx-target={@myself}
        phx-change="validate"
        phx-submit="save"
      >
        <%= if @project.id do %>
          <h1> <%=@project.id %></h1>
        <% else %>
          <.input field={@form[:id]} type="text" label="Project id" />
        <% end %>
        <.input field={@form[:visible]} type="checkbox" label="Visible" />

        <div>
          <label>Names</label>
          <.inputs_for :let={ef} field={@form[:names]}>
            <input type="hidden" name="project[names_sort][]" value={ef.index} />
            <.input type="text" field={ef[:language]} placeholder="language" />
            <.input type="text" field={ef[:text]} placeholder="text" />
            <label>
              <input type="checkbox" name="project[names_drop][]" value={ef.index} class="hidden" />
              <.icon name="hero-x-mark" class="w-6 h-6 relative top-2" />
            </label>
          </.inputs_for>

          <label class="block cursor-pointer">
            <input type="checkbox" name="project[names_sort][]" class="hidden" />
            add more
          </label>

          <input type="hidden" name="project[names_drop][]" />
        </div>
        <div>
          <label>Descriptions</label>
          <.inputs_for :let={ef} field={@form[:descriptions]}>
            <input type="hidden" name="project[descriptions_sort][]" value={ef.index} />
            <.input type="text" field={ef[:language]} placeholder="language" />
            <.input type="text" field={ef[:text]} placeholder="text" />
            <label>
              <input type="checkbox" name="project[descriptions_drop][]" value={ef.index} class="hidden" />
              <.icon name="hero-x-mark" class="w-6 h-6 relative top-2" />
            </label>
          </.inputs_for>

          <label class="block cursor-pointer">
            <input type="checkbox" name="project[descriptions_sort][]" class="hidden" />
            add more
          </label>

          <input type="hidden" name="project[descriptions_drop][]" />
        </div>
        <:actions>
          <.button phx-disable-with="Saving...">Save Project</.button>
        </:actions>
      </.simple_form>
    </div>
    """
  end

  @impl true
  def update(%{project: project} = assigns, socket) do
    changeset = Projects.change_project(project)

    {:ok,
     socket
     |> assign(assigns)
     |> assign_form(changeset)}
  end

  @impl true
  def handle_event("validate", %{"project" => project_params}, socket) do
    changeset =
      socket.assigns.project
      |> Projects.change_project(project_params)
      |> Map.put(:action, :validate)

    {:noreply, assign_form(socket, changeset)}
  end

  def handle_event("save", %{"project" => project_params}, socket) do
    save_project(socket, socket.assigns.action, project_params)
  end

  defp save_project(socket, :edit, project_params) do
    case Projects.update_project(socket.assigns.project, project_params) do
      {:ok, project} ->
        notify_parent({:saved, project})

        {:noreply,
         socket
         |> put_flash(:info, "Project updated successfully")
         |> push_patch(to: socket.assigns.patch)}

      {:error, %Ecto.Changeset{} = changeset} ->
        {:noreply, assign_form(socket, changeset)}
    end
  end

  defp save_project(socket, :new, project_params) do
    case Projects.create_project(project_params) do
      {:ok, project} ->
        notify_parent({:saved, project})

        {:noreply,
         socket
         |> put_flash(:info, "Project created successfully")
         |> push_patch(to: socket.assigns.patch)}

      {:error, %Ecto.Changeset{} = changeset} ->
        {:noreply, assign_form(socket, changeset)}
    end
  end

  defp assign_form(socket, %Ecto.Changeset{} = changeset) do
    assign(socket, :form, to_form(changeset))
  end

  defp notify_parent(msg), do: send(self(), {__MODULE__, msg})
end
