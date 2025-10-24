defmodule FieldHubWeb.Live.ProjectList do
  use FieldHubWeb, :live_view

  alias FieldHub.{
    Project,
    ProjectInfo,
    User
  }

  def mount(_params, _session, %{assigns: %{current_user: current_user}} = socket) do
    socket =
      case current_user do
        nil ->
          socket

        user_name when is_binary(user_name) ->
          projects = Project.get_all_for_user(user_name)

          enriched_projects =
            Enum.map(projects, &build_enriched_project/1)

          assign(socket, :projects, enriched_projects)
      end

    {:ok, assign(socket, :page_title, "Overview")}
  end

  def handle_event("go_to_project", %{"id" => id}, socket) do
    {:noreply, redirect(socket, to: ~p"/ui/projects/show/#{id}")}
  end

  defp build_enriched_project(project_id) do
    stats = ProjectInfo.database_stats(project_id)

    %{
      id: project_id,
      name: project_id
    }
    |> Map.merge(stats)
  end
end
