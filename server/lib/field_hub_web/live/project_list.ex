defmodule FieldHubWeb.Live.ProjectList do
  use FieldHubWeb, :live_view

  alias FieldHub.{
    Project,
    User,
    CouchService
  }

  @default_sort_by :name
  @default_sort_direction :asc

  require Logger

  def mount(_params, _session, %{assigns: %{current_user: current_user}} = socket) do
    socket =
      case current_user do
        nil ->
          socket

        user_name when is_binary(user_name) ->
          projects = Project.get_all_for_user(user_name)

          {errors, enriched_projects} =
            Enum.map(projects, fn project_id ->
              try do
                %{
                  database: %{
                    doc_count: doc_count,
                    file_size: database_file_size,
                    last_n_changes: last_n_changes
                  },
                  files: %{
                    thumbnail_image: %{
                      active: thumbnail_count,
                      active_size: thumbnail_file_size
                    },
                    original_image: %{
                      active: original_count,
                      active_size: original_file_size
                    }
                  }
                } = Project.evaluate_project(project_id, 1)

                %{date: last_change_date_time, user: last_change_user} =
                  case List.first(last_n_changes) do
                    nil ->
                      %{date: nil, user: nil}

                    change ->
                      change
                      |> CouchService.extract_most_recent_change_info()
                      |> (fn {_type, date_time, user} -> %{date: date_time, user: user} end).()
                  end

                {
                  :ok,
                  %{
                    id: project_id,
                    name: project_id,
                    doc_count: doc_count,
                    database_file_size: database_file_size,
                    image_file_size: thumbnail_file_size + original_file_size,
                    last_change_date: last_change_date_time,
                    last_change_user: last_change_user
                  }
                }
              rescue
                error ->
                  Logger.error(error)
                  {:error, {error, project_id}}
              end
            end)
            |> Enum.split_with(fn {status, _content} -> status == :error end)

          enriched_projects = Enum.map(enriched_projects, fn {:ok, info} -> info end)
          errors = Enum.map(errors, fn {:error, info} -> info end)

          socket
          |> assign(:projects, enriched_projects)
          |> assign(:errors, errors)
          |> assign(:sort_by, @default_sort_by)
          |> assign(:sort_direction, @default_sort_direction)
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

  defp sort_projects(projects, :database_file_size, direction) do
    Enum.sort_by(projects, & &1.database_file_size, direction)
  end

  defp sort_projects(projects, :image_file_size, direction) do
    Enum.sort_by(projects, & &1.image_file_size, direction)
  end

  defp sort_projects(projects, :last_change_date, direction) do
    Enum.sort_by(
      projects,
      fn project ->
        case project.last_change_date do
          nil -> (direction == :asc && ~U[0000-01-01 00:00:00Z]) || ~U[9999-12-31 23:59:59Z]
          date_time -> date_time
        end
      end,
      direction
    )
  end

  defp sort_indicator(current_sort, current_direction, column) do
    if current_sort == column do
      case current_direction do
        :asc -> "\u2b61"
        :desc -> "\u2b63"
      end
    else
      "\u2b65"
    end
  end
end
