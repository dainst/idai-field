defmodule FieldPublicationWeb.ProjectLive.Show do
  use FieldPublicationWeb, :live_view

  alias FieldPublication.Schema.Project

  @impl true
  def mount(_params, _session, socket) do
    {:ok, socket}
  end

  @impl true
  def handle_params(%{"id" => id}, _, socket) do
    {:noreply,
     socket
     |> assign(:page_title, page_title(socket.assigns.live_action))
     |> assign(:project, Project.get_project!(id))}
  end

  @impl true
  def handle_params(%{"project_id" => project_id, "draft_date" => draft_date}, _, socket) do
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

  @impl true
  def handle_info({FieldPublicationWeb.PublicationLive.FormComponent, {:updated_publication, publication}}, socket) do
    {:ok, updated_project} = Project.add_publication(socket.assigns.project, publication)

    {:noreply, assign(socket, :project, updated_project)}
  end


  defp page_title(:show), do: "Show Project"
  defp page_title(:edit), do: "Edit Project"
  defp page_title(:edit_publication), do: "Edit publication"
end
