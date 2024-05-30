defmodule FieldPublicationWeb.Publishing.ProjectLive.Index do
  use FieldPublicationWeb, :live_view

  alias FieldPublication.Schemas.Project
  alias FieldPublication.Projects
  alias FieldPublication.Publications
  alias FieldPublication.Processing

  @impl true
  def mount(_params, _session, socket) do
    projects =
      Projects.list()
      |> Enum.filter(fn %Project{} = project ->
        Projects.has_project_access?(project.name, socket.assigns.current_user)
      end)

    {
      :ok,
      socket
      |> assign(:projects, projects)
      |> assign(:page_title, "Listing Projects")
    }
  end

  @impl true
  def handle_params(params, _url, socket) do
    {:noreply, apply_action(socket, socket.assigns.live_action, params)}
  end

  defp apply_action(socket, :edit, %{"project_id" => id}) do
    socket
    |> assign(:page_title, "Edit Project")
    |> assign(:project, Projects.get!(id))
  end

  defp apply_action(socket, :new, _params) do
    socket
    |> assign(:page_title, "New Project")
    |> assign(:project, %Project{})
  end

  defp apply_action(socket, :index, _params) do
    socket
    |> assign(:page_title, "Listing Projects")
    |> assign(:project, nil)
  end

  @impl true
  def handle_info(
        {FieldPublicationWeb.Publishing.ProjectLive.FormComponent, {:saved, _project}},
        socket
      ) do
    {:noreply, assign(socket, :projects, Projects.list())}
  end

  @impl true
  def handle_event("delete", %{"project_id" => id}, socket) do
    project = Projects.get!(id)
    {:ok, _} = Projects.delete(project)

    {:noreply, assign(socket, :projects, Projects.list())}
  end

  def handle_event("reindex_all_search_indices", _, socket) do
    Projects.list()
    |> Stream.map(fn %{name: name} -> name end)
    |> Stream.map(&Publications.get_current_published(&1))
    |> Stream.reject(fn val -> val == :none end)
    |> Enum.each(&Processing.start(&1, :search_index))

    {:noreply, socket}
  end

  def publication_stats(publications) do
    %{
      draft_count:
        publications
        |> Enum.filter(fn pub -> is_nil(pub.publication_date) end)
        |> Enum.count(),
      publication_scheduled_count:
        publications
        |> Enum.filter(fn pub -> not is_nil(pub.publication_date) end)
        |> Enum.filter(fn pub -> pub.publication_date < Date.utc_today() end)
        |> Enum.count(),
      published_count:
        publications
        |> Enum.filter(fn pub -> not is_nil(pub.publication_date) end)
        |> Enum.filter(fn pub -> pub.publication_date > Date.utc_today() end)
        |> Enum.count()
    }
  end
end
