defmodule FieldPublicationWeb.Management.OverviewLive do
  use FieldPublicationWeb, :live_view

  alias FieldPublication.DatabaseSchema.{
    Project,
    Publication,
    ReplicationInput
  }

  alias FieldPublication.Projects
  alias FieldPublication.Publications
  alias FieldPublication.Processing
  alias FieldPublication.Users

  alias Phoenix.PubSub

  require Logger

  @impl true
  def mount(_params, _session, socket) do
    {
      :ok,
      socket
      |> load_projects()
      |> update_processing_state()
      |> assign(:users, Users.list())
      |> assign(:today, Date.utc_today())
      |> assign(:page_title, "Publishing")
    }
  end

  @impl true
  def handle_params(params, _url, socket) do
    {:noreply, apply_action(socket, socket.assigns.live_action, params)}
  end

  defp apply_action(socket, :edit_project, %{"project_identifier" => id}) do
    socket
    |> assign(:page_title, "Publishing | Edit Project")
    |> assign(:project, Projects.get!(id))
  end

  defp apply_action(socket, :new_project, _params) do
    socket
    |> assign(:page_title, "Publishing | New Project")
    |> assign(:project, %Project{})
  end

  defp apply_action(socket, :new_publication, %{"project_identifier" => id}) do
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
        {FieldPublicationWeb.Management.Modals.ProjectFormComponent, {:saved, _project}},
        socket
      ) do
    {:noreply, load_projects(socket)}
  end

  def handle_info(
        {FieldPublicationWeb.Management.Modals.ReplicationFormComponent,
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
          ~p"/management/projects/#{publication.project_identifier}/publication/#{publication.draft_date}"
      )
    }
  end

  def handle_info(
        {publication_id, {:processing_started, processing_type}},
        %{assigns: %{processing_state: state}} = socket
      ) do
    updated_state =
      Map.update(state, publication_id, %{processing_type => nil}, fn publication_state ->
        Map.put(publication_state, processing_type, nil)
      end)

    {
      :noreply,
      assign(socket, :processing_state, updated_state)
    }
  end

  def handle_info(
        {publication_id, {:processing_stopped, processing_type}},
        %{assigns: %{processing_state: state}} = socket
      ) do
    updated_state =
      Map.update(state, publication_id, %{}, fn publication_state ->
        Map.delete(publication_state, processing_type)
      end)

    updated_state =
      if updated_state[publication_id] == %{},
        do: Map.delete(updated_state, publication_id),
        else: updated_state

    {
      :noreply,
      assign(socket, :processing_state, updated_state)
    }
  end

  def handle_info(
        {publication_id, {:processing_progress, processing_type, progress}},
        %{assigns: %{processing_state: state}} = socket
      ) do
    updated_state =
      Map.update(state, publication_id, %{processing_type => nil}, fn publication_state ->
        Map.put(publication_state, processing_type, progress)
      end)

    {
      :noreply,
      assign(socket, :processing_state, updated_state)
    }
  end

  def handle_info(
        {publication_id, {replication_process_type, progress}},
        %{assigns: %{processing_state: state}} = socket
      )
      when replication_process_type in [:document_replication_count, :file_replication_count] do
    updated_state =
      Map.update(
        state,
        publication_id,
        %{replication_process_type => nil},
        fn publication_state ->
          Map.put(publication_state, replication_process_type, progress)
        end
      )

    {
      :noreply,
      assign(socket, :processing_state, updated_state)
    }
  end

  def handle_info(
        {publication_id, {:replication_stopped}},
        %{assigns: %{processing_state: state}} = socket
      ) do
    updated_state =
      Map.update(state, publication_id, %{}, fn publication_state ->
        publication_state
        |> Map.delete(:document_replication_count)
        |> Map.delete(:file_replication_count)
      end)

    updated_state =
      if updated_state[publication_id] == %{},
        do: Map.delete(updated_state, publication_id),
        else: updated_state

    {
      :noreply,
      assign(socket, :processing_state, updated_state)
    }
  end

  def handle_info(info, socket) do
    Logger.debug("Ignoring handle_info/2 call:")
    Logger.debug(inspect(info))
    {:noreply, socket}
  end

  @impl true
  def handle_event("delete", %{"project_id" => id}, socket) do
    project = Projects.get!(id)
    {:ok, _} = Projects.delete(project)

    {:noreply, load_projects(socket)}
  end

  def handle_event(
        "delete-publication",
        %{"project_identifier" => project_identifier, "draft_date" => draft_date},
        socket
      ) do
    Publications.get(project_identifier, draft_date)
    |> case do
      {:ok, publication} ->
        Publications.delete(publication)

      _ ->
        :ok
    end

    {:noreply, load_projects(socket)}
  end

  def handle_event("reindex_all_search_indices", _, socket) do
    Publications.list()
    |> Enum.each(&Processing.start(&1, :search_index))

    {:noreply, socket}
  end

  def handle_event("recreate_previews", _, socket) do
    Publications.list()
    |> Enum.each(&Processing.start(&1, :preview_documents))

    {:noreply, socket}
  end

  def handle_event(
        "set_project_alias",
        %{"draft_date" => draft_date, "project_identifier" => project_identifier},
        %{assigns: %{projects: projects}} = socket
      ) do
    Enum.find(projects, fn entry ->
      entry.project.identifier == project_identifier
    end)
    |> Map.get(:publications, [])
    |> Enum.find(fn publication ->
      Date.to_string(publication.draft_date) == draft_date
    end)
    |> Publications.Search.set_project_alias()

    {:noreply, load_projects(socket)}
  end

  defp load_projects(socket) do
    projects =
      Projects.list()
      |> Enum.filter(fn %Project{} = project ->
        Projects.has_project_access?(project.identifier, socket.assigns.current_user)
      end)
      |> Enum.map(fn project ->
        publications = Publications.list(project.identifier)

        Enum.each(publications, fn publication ->
          channel = Publications.get_doc_id(publication)
          PubSub.subscribe(FieldPublication.PubSub, channel)
        end)

        %{
          project: project,
          publications: publications,
          search_aliased_publication:
            Publications.Search.get_currently_aliased_publication(project)
        }
      end)

    assign(socket, :projects, projects)
  end

  defp update_processing_state(socket) do
    processing_state =
      if FieldPublication.Users.is_admin?(socket.assigns.current_user) do
        Processing.show()
        |> Enum.map(fn {_task, type, id} -> {id, %{type => nil}} end)
        |> Enum.into(%{})
      else
        %{}
      end

    assign(socket, :processing_state, processing_state)
  end
end
