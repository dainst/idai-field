defmodule FieldPublicationWeb.ProjectLive.Show do
  use FieldPublicationWeb, :live_view

  alias FieldPublication.Projects

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
    |> assign(:project, Projects.get!(id))
  end

  defp apply_action(socket, :edit, %{"project_id" => id}) do
    socket
    |> assign(:page_title, page_title(socket.assigns.live_action))
    |> assign(:project, Projects.get!(id))
  end

  defp apply_action(socket, :draft_publication, %{
         "project_id" => project_id
       }) do
    project = Projects.get!(project_id)

    socket
    |> assign(:page_title, page_title(socket.assigns.live_action))
    |> assign(:project, project)
  end

  @impl true
  def handle_info({FieldPublicationWeb.ProjectLive.FormComponent, {:saved, project}}, socket) do
    {:noreply, assign(socket, :project, project)}
  end

  # @impl true
  # def handle_info(
  #       {FieldPublicationWeb.PublicationLive.FormComponent, {:updated_publication, publication}},
  #       socket
  #     ) do
  #   {:ok, updated_project} = Project.add_publication(socket.assigns.project, publication)

  #   {:noreply, assign(socket, :project, updated_project)}
  # end

  # @impl true
  # def handle_event("delete_publication", %{"date" => date}, socket) do
  #   deleted =
  #     Enum.find(socket.assigns.project.publications, fn publication ->
  #       Date.to_string(publication.draft_date) == date
  #     end)

  #   {:ok, updated_project} = Project.remove_publication(socket.assigns.project, deleted)

  #   {:noreply, assign(socket, :project, updated_project)}
  # end

  defp page_title(:show), do: "Show Project"
  defp page_title(:edit), do: "Edit Project"
  defp page_title(:draft_publication), do: "Draft publication"
end
