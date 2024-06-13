defmodule FieldPublicationWeb.Management.OverviewLive do
  use FieldPublicationWeb, :live_view

  alias FieldPublication.DocumentSchema.{
    Project,
    Publication,
    ReplicationInput
  }

  alias FieldPublication.Projects
  alias FieldPublication.Publications
  alias FieldPublication.Processing

  @impl true
  def mount(_params, _session, socket) do
    {
      :ok,
      socket
      |> assign_projects()
      |> assign(:today, Date.utc_today())
      |> assign(:page_title, "Publishing")
    }
  end

  @impl true
  def handle_params(params, _url, socket) do
    {:noreply, apply_action(socket, socket.assigns.live_action, params)}
  end

  defp apply_action(socket, :edit_project, %{"project_id" => id}) do
    socket
    |> assign(:page_title, "Publishing | Edit Project")
    |> assign(:project, Projects.get!(id))
  end

  defp apply_action(socket, :new_project, _params) do
    socket
    |> assign(:page_title, "Publishing | New Project")
    |> assign(:project, %Project{})
  end

  defp apply_action(socket, :new_publication, %{"project_id" => id}) do
    socket
    |> assign(:page_title, "Publishing | New publication draft")
    |> assign(:project, Projects.get!(id))
  end

  defp apply_action(socket, :index, _params) do
    socket
    |> assign(:page_title, "Publishing")
    |> assign(:project, nil)
  end

  @impl true
  def handle_info(
        {FieldPublicationWeb.Management.ProjectFormComponent, {:saved, _project}},
        socket
      ) do
    {:noreply, assign_projects(socket)}
  end

  @impl true
  def handle_info(
        {FieldPublicationWeb.Management.PublicationLive.ReplicationFormComponent,
         {%ReplicationInput{} = params, %Publication{} = publication}},
        socket
      ) do
    FieldPublication.Replication.start(
      params,
      publication
    )

    {
      :noreply,
      socket
      |> push_navigate(
        to:
          ~p"/management/projects/#{publication.project_name}/publication/#{publication.draft_date}"
      )
    }
  end

  @impl true
  def handle_event("delete", %{"project_id" => id}, socket) do
    project = Projects.get!(id)
    {:ok, _} = Projects.delete(project)

    {:noreply, assign_projects(socket)}
  end

  def handle_event("reindex_all_search_indices", _, socket) do
    Projects.list()
    |> Stream.map(fn %{name: name} -> name end)
    |> Stream.map(&Publications.get_current_published(&1))
    |> Stream.reject(fn val -> val == :none end)
    |> Enum.each(&Processing.start(&1, :search_index))

    {:noreply, socket}
  end

  defp assign_projects(socket) do
    projects =
      Projects.list()
      |> Enum.filter(fn %Project{} = project ->
        Projects.has_project_access?(project.name, socket.assigns.current_user)
      end)
      |> Enum.map(fn project ->
        publications = Publications.list(project.name)

        %{
          project: project,
          publications: publications
        }
      end)

    assign(socket, :projects, projects)
  end
end
