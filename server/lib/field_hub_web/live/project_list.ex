defmodule FieldHubWeb.Live.ProjectList do
  use FieldHubWeb, :live_view

  alias FieldHub.{
    Project,
    ProjectInfo,
    User
  }

  @default_sort_by :name
  @default_sort_diection :asc

  def mount(_params, _session, %{assigns: %{current_user: current_user}} = socket) do
    socket =
      case current_user do
        nil ->
          socket

        user_name when is_binary(user_name) ->
          projects = Project.get_all_for_user(user_name)

          enriched_projects =
            Enum.map(projects, &build_enriched_project/1)

          socket
          |> assign(:projects, enriched_projects)
          |> assign(:sort_by, @default_sort_by)
          |> assign(:sort_direction, @default_sort_diection)
      end

    {:ok, assign(socket, :page_title, "Overview")}
  end

    def handle_event("sort", %{"field" => field}, socket) do
    field = String.to_atom(field)

    {sort_direction, sort_by} =
      if socket.assigns.sort_by == field do
        {toggle_direction(socket.assigns.sort_direction), field}
      else
        {:asc, field}
      end

    sorted_projects = sort_projects(socket.assigns.projects, sort_by, sort_direction)

    socket =
      socket
      |> assign(:projects, sorted_projects)
      |> assign(:sort_by, sort_by)
      |> assign(:sort_direction, sort_direction)

    {:noreply, socket}
  end

  def handle_event("go_to_project", %{"id" => id}, socket) do
    {:noreply, redirect(socket, to: ~p"/ui/projects/show/#{id}")}
  end

  defp toggle_direction(:asc), do: :desc

  defp toggle_direction(:desc), do: :asc

  defp sort_projects(projects, :name, direction) do
    Enum.sort_by(projects, & &1.name, direction)
  end

  defp sort_projects(projects, :doc_count, direction) do
    Enum.sort_by(projects, & &1.doc_count, direction)
  end

  defp sort_projects(projects, :file_size, direction) do
    Enum.sort_by(projects, & &1.file_size, direction)
  end

  defp sort_projects(projects, :last_change_date, direction) do
    Enum.sort_by(projects, fn project ->
      case project.last_change_date do
        nil -> direction == :asc && ~U[0000-01-01 00:00:00Z] || ~U[9999-12-31 23:59:59Z]
        date_time  -> date_time
      end
    end, direction)
  end

  defp build_enriched_project(project_id) do
    stats = ProjectInfo.database_stats(project_id)

    %{
      id: project_id,
      name: project_id
    }
    |> Map.merge(stats)
  end

  defp sort_indicator(current_sort, current_direction, column) do
    if current_sort == column do
      case current_direction do
        :asc  -> "\u2b61"
        :desc -> "\u2b63"
      end
    else
      "\u2b65"
    end
  end

end
