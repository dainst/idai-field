defmodule FieldHubWeb.Live.ProjectList do
  use FieldHubWeb, :live_view

  alias Phoenix.PubSub

  alias FieldHub.{
    Project,
    Project.DatabaseInfo,
    Project.ChangeInfo,
    User
  }

  require Logger

  def mount(_params, _session, %{assigns: %{current_user: current_user}} = socket) do
    socket =
      cond do
        is_nil(current_user) ->
          # TODO?
          socket

        Project.exists?(current_user) ->
          # Redirect to project's page if user is not an admin (implicitley given because there is a project of
          # the same name).
          push_navigate(socket, to: "/ui/projects/show/#{current_user}")

        User.is_admin?(current_user) ->
          # Render project list for administrator.
          project_keys = Project.get_all_for_user(current_user)

          database_infos =
            Task.async_stream(project_keys, fn project_key ->
              PubSub.subscribe(FieldHub.PubSub, project_key)
              {project_key, Project.database_info(project_key)}
            end)
            |> Enum.map(fn {:ok, result} ->
              result
            end)
            |> Enum.into(%{})

          {overall_database_size, overall_doc_count} =
            database_infos
            |> Map.values()
            |> Enum.reduce(
              {0, 0},
              fn %DatabaseInfo{size: size, doc_count: count}, {size_acc, count_acc} ->
                {size_acc + size, count_acc + count}
              end
            )

          file_infos =
            Enum.map(project_keys, fn project_key ->
              task =
                Task.Supervisor.async_nolink(FieldHub.TaskSupervisor, fn ->
                  {:file_info, {project_key, Project.file_store_info(project_key)}}
                end)

              {project_key, {:loading, task}}
            end)
            |> Enum.into(%{})

          socket
          |> assign(:page_title, "Overview")
          |> assign(:sort, {nil, nil})
          |> assign(:project_keys, project_keys)
          |> assign(:database_infos, database_infos)
          |> assign(:file_infos, file_infos)
          |> assign(:aggregated_info, %{
            database_size: overall_database_size,
            doc_count: overall_doc_count,
            thumbnail_size: 0,
            thumbnail_count: 0,
            original_size: 0,
            original_count: 0
          })
          |> assign(:errors, %{})
      end

    {:ok, socket}
  end

  def handle_params(params, _, %{assigns: %{project_keys: _project_keys}} = socket) do
    default_sort = {"projects", :asc}

    new_sort_params =
      case Map.get(params, "sort") do
        nil ->
          nil

        param ->
          String.split(param, "|")
      end
      |> case do
        [column, direction] ->
          parsed_direction =
            case direction do
              "asc" -> :asc
              "desc" -> :desc
              _ -> :asc
            end

          {column, parsed_direction}

        _ ->
          default_sort
      end

    {
      :noreply,
      socket
      |> assign(:sort, new_sort_params)
      |> apply_sort()
    }
  end

  def handle_params(_, _, socket) do
    {
      :noreply,
      socket
    }
  end

  def handle_event(
        "toggle-sort",
        %{"column" => column},
        %{assigns: %{sort: {current_column, direction}}} = socket
      ) do
    socket =
      cond do
        is_nil(current_column) || current_column != column ->
          push_patch(socket, to: ~p"/?#{%{sort: "#{column}|asc"}}")

        current_column == column and direction == :asc ->
          push_patch(socket, to: ~p"/?#{%{sort: "#{column}|desc"}}")

        current_column == column and direction == :desc ->
          push_patch(socket, to: ~p"/")
      end

    {:noreply, socket}
  end

  def handle_info({project_key, %FieldHub.Issues.Issue{} = issue}, socket) do
    {
      :noreply,
      update(socket, :errors, fn existing ->
        Map.update(existing, project_key, [issue], fn existing_for_project ->
          existing_for_project ++ [issue]
        end)
      end)
    }
  end

  def handle_info(
        {
          ref,
          {
            :file_info,
            {
              project_key,
              %{
                thumbnail_image: %{active: thumbnail_count, active_size: thumbnail_size},
                original_image: %{active: original_count, active_size: original_size}
              }
            }
          }
        },
        socket
      ) do
    Process.demonitor(ref, [:flush])

    {
      :noreply,
      socket
      |> update(:file_infos, fn infos ->
        Map.put(infos, project_key, %{
          thumbnail_count: thumbnail_count,
          thumbnail_size: thumbnail_size,
          original_count: original_count,
          original_size: original_size
        })
      end)
      |> update(:aggregated_info, fn infos ->
        infos
        |> Map.put(:thumbnail_size, infos.thumbnail_size + thumbnail_size)
        |> Map.put(:thumbnail_count, infos.thumbnail_count + thumbnail_count)
        |> Map.put(:original_size, infos.original_size + original_size)
        |> Map.put(:original_count, infos.original_count + original_count)
      end)
    }
  end

  def handle_info(
        {
          :DOWN,
          ref,
          _,
          _pid,
          _error
        },
        %{assigns: %{file_infos: file_infos}} = socket
      ) do
    # The file system evaluation task for a project crashed, evaluate the affected project
    # by the task reference and push the appropriate errors to the user.
    {project_key_with_error, _} =
      Enum.find(file_infos, fn {_project_key, status} ->
        case status do
          {:loading, %Task{ref: running_task_ref}} when running_task_ref == ref ->
            true

          _ ->
            false
        end
      end)

    {
      :noreply,
      socket
      |> update(:file_infos, fn infos ->
        Map.put(infos, project_key_with_error, :error)
      end)
      |> update(:errors, fn existing ->
        issue = %FieldHub.Issues.Issue{
          severity: :error,
          type: :error_reading_file_system,
          data: %{}
        }

        Map.update(existing, project_key_with_error, [issue], fn existing_for_project ->
          existing_for_project ++ [issue]
        end)
      end)
    }
  end

  attr(:column, :string, required: true)
  attr(:active, :any, required: true)
  slot(:inner_block, required: true)

  defp th(assigns) do
    ~H"""
    <% {active_column, direction} = @active %>
    <th
      class={"sortable-list-heading #{if active_column == @column, do: direction}"}
      phx-click="toggle-sort"
      phx-value-column={@column}
    >
      {render_slot(@inner_block)}
    </th>
    """
  end

  defp apply_sort(
         %{
           assigns: %{project_keys: project_keys, sort: {"projects", direction}}
         } = socket
       ) do
    assign(socket, :project_keys, Enum.sort(project_keys, direction))
  end

  defp apply_sort(
         %{
           assigns: %{
             project_keys: project_keys,
             sort: {"document_count", direction},
             database_infos: db_infos
           }
         } = socket
       ) do
    assign(
      socket,
      :project_keys,
      Enum.sort(
        project_keys,
        fn project_key_a, project_key_b ->
          %DatabaseInfo{doc_count: doc_count_a} = db_infos[project_key_a]

          %DatabaseInfo{doc_count: doc_count_b} = db_infos[project_key_b]

          if direction == :asc do
            doc_count_a >= doc_count_b
          else
            doc_count_a < doc_count_b
          end
        end
      )
    )
  end

  defp apply_sort(
         %{
           assigns: %{
             project_keys: project_keys,
             sort: {"thumbnail_count", direction},
             file_infos: file_infos
           }
         } = socket
       ) do
    assign(
      socket,
      :project_keys,
      Enum.sort(
        project_keys,
        fn project_key_a, project_key_b ->
          count_a =
            file_infos[project_key_a]
            |> case do
              :loading ->
                -1

              %{thumbnail_count: val} ->
                val
            end

          count_b =
            file_infos[project_key_b]
            |> case do
              :loading ->
                -1

              %{thumbnail_count: val} ->
                val
            end

          if direction == :asc do
            count_a >= count_b
          else
            count_a < count_b
          end
        end
      )
    )
  end

  defp apply_sort(
         %{
           assigns: %{
             project_keys: project_keys,
             sort: {"image_count", direction},
             file_infos: file_infos
           }
         } = socket
       ) do
    assign(
      socket,
      :project_keys,
      Enum.sort(
        project_keys,
        fn project_key_a, project_key_b ->
          count_a =
            file_infos[project_key_a]
            |> case do
              :loading ->
                -1

              %{original_count: val} ->
                val
            end

          count_b =
            file_infos[project_key_b]
            |> case do
              :loading ->
                -1

              %{original_count: val} ->
                val
            end

          if direction == :asc do
            count_a >= count_b
          else
            count_a < count_b
          end
        end
      )
    )
  end

  defp apply_sort(
         %{
           assigns: %{
             project_keys: project_keys,
             sort: {"last_change", direction},
             database_infos: db_infos
           }
         } = socket
       ) do
    assign(
      socket,
      :project_keys,
      Enum.sort(
        project_keys,
        fn project_key_a, project_key_b ->
          last_change_a = List.first(db_infos[project_key_a].last_changes)
          last_change_b = List.first(db_infos[project_key_b].last_changes)

          if direction == :asc do
            last_change_a < last_change_b
          else
            last_change_a > last_change_b
          end
        end
      )
    )
  end
end
