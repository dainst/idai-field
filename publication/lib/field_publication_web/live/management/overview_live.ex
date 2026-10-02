defmodule FieldPublicationWeb.Management.OverviewLive do
  use FieldPublicationWeb, :live_view

  alias FieldPublication.{
    Replication.ReplicationInput,
    Processing,
    Project,
    Publication,
    Publication.Search,
    User
  }

  alias Phoenix.PubSub

  require Logger

  def render_project(assigns) do
    ~H"""
    <div class="border border-primary m-4" id={"project-panel-#{@project.identifier}"}>
      <h3 class="bg-panel p-4 m-2 text-center text-lg">
        Project '{@project.identifier}'
      </h3>

      <.render_project_info_and_actions {assigns} />

      <div class="m-4">
        <p class="font-semibold mb-2 ">Publications ({Enum.count(@publications)})</p>
        <%= if @publications == [] do %>
          -
        <% else %>
          <%= for %Publication{} = publication <- @publications do %>
            <.render_publication
              publication={publication}
              current_user={@current_user}
              user_info={@user_info}
              search_aliased_publication={@search_aliased_publication}
            />
          <% end %>
        <% end %>
      </div>
    </div>
    """
  end

  def render_project_info_and_actions(assigns) do
    ~H"""
    <div class="ml-4 mr-4 grid grid-cols-2">
      <div>
        <p class="font-semibold">Actions</p>
        <ul class="list-disc list-inside">
          <li>
            <.link navigate={~p"/management/projects/#{@project.identifier}/publication/new"}>
              Draft new publication
            </.link>
          </li>
          <%= if User.is_admin?(@current_user) do %>
            <li>
              <.link
                id={"edit-project-link-#{@project.identifier}"}
                navigate={~p"/management/projects/#{@project.identifier}/edit"}
                phx-click={JS.push_focus()}
              >
                Edit
              </.link>
            </li>
            <li>
              <.link
                id={"delete-project-link-#{@project.identifier}"}
                phx-click={
                  JS.push("delete", value: %{project_id: @project.identifier})
                  |> hide("##{@project.identifier}")
                }
                data-confirm="Are you sure?"
              >
                Delete
              </.link>
            </li>
          <% end %>
        </ul>
      </div>
      <div>
        <p class="font-semibold">Editors</p>
        <%= unless @project.editors == [] do %>
          <ul>
            <%= for editor <- @project.editors do %>
              <li>
                <a href={"mailto:#{@user_info[editor].email}"}>{@user_info[editor].label}</a>
              </li>
            <% end %>
          </ul>
        <% else %>
          <div class="">-</div>
        <% end %>
      </div>
    </div>

    <div class="ml-4 mr-4 italic">
      <%= if {:error, :alias_not_set} == @search_aliased_publication do %>
        <.icon name="hero-exclamation-circle" />
        No publication is set to be included in application wide search for this project.
      <% end %>
    </div>
    """
  end

  def render_publication(assigns) do
    ~H"""
    <table class="text-black text-sm table-auto w-full mb-8 hover:outline-offset-2 hover:outline-slate-300 hover:outline">
      <tbody>
        <tr>
          <td colspan="2">
            <p class="font-semibold">Actions</p>
            <ul class="list-disc list-inside">
              <li>
                <%= if is_nil(@publication.replication_finished) do %>
                  Replication still running...
                <% else %>
                  <.link navigate={
                    ~p"/projects/#{@publication.project_identifier}/#{@publication.draft_date}"
                  }>
                    <.icon name="hero-home-solid w-4 h-4" />
                    <%= if is_nil(@publication.publication_date) do %>
                      Preview draft
                    <% else %>
                      View
                    <% end %>
                  </.link>
                <% end %>
              </li>

              <li>
                <.link navigate={
                  ~p"/management/projects/#{@publication.project_identifier}/publication/#{@publication.draft_date}"
                }>
                  Edit
                </.link>
              </li>

              <li :if={is_nil(@publication.publication_date) || User.is_admin?(@current_user)}>
                <.link
                  phx-click={
                    JS.push("delete-publication",
                      value: %{
                        project_identifier: @publication.project_identifier,
                        draft_date: @publication.draft_date
                      }
                    )
                  }
                  data-confirm={"Are you sure you want to delete the publication created on #{@publication.draft_date} for '#{@publication.project_identifier}'?"}
                >
                  Delete
                </.link>
              </li>
            </ul>
          </td>
        </tr>
        <tr>
          <td>
            Draft date
          </td>
          <td>
            {@publication.draft_date}
          </td>
        </tr>
        <tr>
          <td>
            Publication date
          </td>
          <td>
            <%= if is_nil(@publication.publication_date) do %>
              -
            <% else %>
              {@publication.publication_date}
            <% end %>
          </td>
        </tr>
        <tr>
          <td>Drafted by</td>
          <td>
            <a href={"mailto:#{@user_info[@publication.drafted_by].email}"}>
              {@user_info[@publication.drafted_by].label}
            </a>
          </td>
        </tr>
        <tr :if={!is_nil(@publication.publication_date)}>
          <td>Used in application wide search</td>
          <td>
            <%= case @search_aliased_publication do %>
              <% {:ok, aliased_pub} when aliased_pub.draft_date == @publication.draft_date -> %>
                <.link navigate={
                  ~p"/search?#{%{filters: [project_identifier: @publication.project_identifier]}}"
                }>
                  <.icon name="hero-check" />
                </.link>
              <% _ -> %>
                <.link
                  phx-click="set_project_alias"
                  phx-value-project_identifier={@publication.project_identifier}
                  phx-value-draft_date={@publication.draft_date}
                >
                  Set
                </.link>
            <% end %>
          </td>
        </tr>

        <tr :if={is_nil(@publication.publication_date)}>
          <td colspan="2" class="italic">
            <.icon name="hero-information-circle" /> Still in draft state
          </td>
        </tr>
      </tbody>
    </table>
    """
  end

  @impl true
  def mount(_params, _session, socket) do
    {
      :ok,
      socket
      |> load_projects()
      |> update_processing_state()
      |> assign(:user_info, User.user_info())
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
    |> assign(:project, Project.get!(id))
  end

  defp apply_action(socket, :new_project, _params) do
    socket
    |> assign(:page_title, "Publishing | New Project")
    |> assign(:project, %Project{})
  end

  defp apply_action(socket, :new_publication, %{"project_identifier" => id}) do
    socket
    |> assign(:page_title, "Publishing | New publication draft")
    |> assign(:project, Project.get!(id))
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
    project = Project.get!(id)
    {:ok, _} = Project.delete(project)

    {:noreply, load_projects(socket)}
  end

  def handle_event(
        "delete-publication",
        %{"project_identifier" => project_identifier, "draft_date" => draft_date},
        socket
      ) do
    Publication.get(project_identifier, draft_date)
    |> case do
      {:ok, publication} ->
        Publication.delete(publication)

      _ ->
        :ok
    end

    {:noreply, load_projects(socket)}
  end

  def handle_event("reindex_all_search_indices", _, socket) do
    Publication.list()
    |> Enum.each(&Processing.start(&1, :search_index))

    {:noreply, socket}
  end

  def handle_event("recreate_previews", _, socket) do
    Publication.list()
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
    |> Search.set_project_alias()

    {:noreply, load_projects(socket)}
  end

  defp load_projects(socket) do
    projects =
      Project.list()
      |> Enum.filter(fn %Project{} = project ->
        Project.has_project_access?(project.identifier, socket.assigns.current_user)
      end)
      |> Enum.map(fn project ->
        publications = Publication.list(project.identifier)

        Enum.each(publications, fn publication ->
          PubSub.subscribe(FieldPublication.PubSub, publication._id)
        end)

        %{
          project: project,
          publications: publications,
          search_aliased_publication: Search.get_currently_aliased_publication(project)
        }
      end)

    assign(socket, :projects, projects)
  end

  defp update_processing_state(socket) do
    processing_state =
      if User.is_admin?(socket.assigns.current_user) do
        Processing.show()
        |> Enum.map(fn {_task, type, id} -> {id, %{type => nil}} end)
        |> Enum.into(%{})
      else
        %{}
      end

    assign(socket, :processing_state, processing_state)
  end
end
