defmodule FieldPublicationWeb.ProjectLive.Show do
  use FieldPublicationWeb, :live_view

  alias FieldPublication.Schema.Project
  alias FieldPublication.User

  @impl true
  def mount(_params, _session, socket) do
    {:ok, assign(socket, :today, Date.utc_today())}
  end

  @impl true
  def handle_params(params, _url, socket) do
    {:noreply, apply_action(socket, socket.assigns.live_action, params)}
  end

  defp apply_action(socket, :show, %{"project_id" => id}) do
    socket
    |> assign(:page_title, page_title(socket.assigns.live_action))
    |> assign(:project, Project.get_project!(id))
  end

  defp apply_action(socket, :edit, %{"project_id" => id}) do
    # A project modal is part of this `live view` (which only requires editor status), but we restrict the project :edit action to admins.
    if User.is_admin?(socket.assigns.current_user) do
      socket
      |> assign(:page_title, page_title(socket.assigns.live_action))
      |> assign(:project, Project.get_project!(id))
    else
      socket
      |> Phoenix.LiveView.put_flash(:error, "You are not allowed to access that page.")
      |> Phoenix.LiveView.redirect(to: ~p"/")
    end
  end

  defp apply_action(socket, :edit_publication, %{"project_id" => project_id, "draft_date" => draft_date}) do
    project = Project.get_project!(project_id)
    publication = Enum.find(project.publications, fn(pub) -> Date.to_string(pub.draft_date) == draft_date end)

    {
      :noreply,
      socket
      |> assign(:page_title, page_title(socket.assigns.live_action))
      |> assign(:project, project)
      |> assign(:publication_to_edit, publication)
    }
  end

  def handle_info({FieldPublicationWeb.ProjectLive.FormComponent, {:saved, project}}, socket) do
    {:noreply, assign(socket, :project, project)}
  end

  @impl true
  def handle_info({FieldPublicationWeb.PublicationLive.FormComponent, {:updated_publication, publication}}, socket) do
    {:ok, updated_project} = Project.add_publication(socket.assigns.project, publication)

    {:noreply, assign(socket, :project, updated_project)}
  end

  defp page_title(:show), do: "Show Project"
  defp page_title(:edit), do: "Edit Project"
  defp page_title(:edit_publication), do: "Edit publication"
end
