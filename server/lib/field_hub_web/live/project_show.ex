defmodule FieldHubWeb.Live.ProjectShow do
  use FieldHubWeb, :live_view

  alias FieldHub.Project

  alias FieldHubWeb.UserAuth

  alias FieldHub.{
    CouchService,
    Issues,
    Project,
    User
  }

  require Logger

  @default_sort_by :time
  @default_sort_direction :desc

  def mount(%{"project" => project} = _params, %{"user_token" => user_token} = _session, socket) do
    # TODO: In newer Phoenix version use an `on_mount` plug. This check prevents direct unauthorized
    # access via websocket. In the normal application flow this will be unnesseary
    # because the http plug will already have caught unauthorized access before switching protocols.
    # See https://hexdocs.pm/phoenix_live_view/security-model.html#mounting-considerations

    user_name =
      user_token
      |> UserAuth.get_user_by_session_token()

    Project.check_project_authorization(project, user_name)
    |> case do
      :granted ->
        # For the overview portion we may have to look up the sizes of all files in the project, which may take some seconds. For this
        # reason we implement that evaluation asynchronously. This Process.send/3 will get picked up further down by
        # a handle_info/2.
        Process.send(self(), :update_overview, [])

        {
          :ok,
          socket
          |> assign(:stats, :loading)
          |> assign(:issues_evaluating?, false)
          |> assign(:issues, nil)
          |> assign(:project, project)
          |> assign(:current_user, user_name)
          |> assign(:new_password, "")
          |> assign(:confirm_project_name, "")
          |> assign(:delete_files, false)
          |> assign(:hide_cache_cleared_message, true)
          |> assign(:n_changes_to_display, 100)
          |> assign(:page_title, project)
          |> read_project_doc()
          |> assign(:sort_by, @default_sort_by)
          |> assign(:sort_direction, @default_sort_direction)
        }

      _ ->
        redirect(socket, to: "/")
    end
  end

  def handle_info(
        :update_overview,
        %{assigns: %{project: project, n_changes_to_display: number_of_changes}} = socket
      ) do
    # Evaluate the project asynchronously. Once the task finishes, it will get picked up
    # by another handle_info/2 below.
    Task.async(fn ->
      {:overview_task, Project.evaluate_project(project, number_of_changes)}
    end)

    {:noreply, socket}
  end

  def handle_info({ref, {:overview_task, stats}}, socket) do
    # The asynchronous task is finished, we are not interested in its process anymore and demonitor it.
    Process.demonitor(ref, [:flush])

    # Reschedule the task to be run again in 10 seconds, see above.
    Process.send_after(self(), :update_overview, 10000)

    sorted_changes =
      sort_changes(
        Map.get(stats, :database, %{}) |> Map.get(:last_n_changes, []),
        socket.assigns.sort_by,
        socket.assigns.sort_direction
      )

    sorted_stats =
      Map.update!(stats, :database, fn db ->
        Map.put(db, :last_n_changes, sorted_changes)
      end)

    {
      :noreply,
      socket
      |> assign(:stats, sorted_stats)
    }
  end

  def handle_info({ref, {:issues_task, issues}}, socket) do
    # The asynchronous task is finished, we are not interested in its process anymore and demonitor it.
    Process.demonitor(ref, [:flush])

    issue_count = Enum.count(issues)

    {
      :noreply,
      socket
      |> assign(:issues, issues)
      |> assign(:issues_evaluating?, false)
      |> assign(:issue_count, issue_count)
    }
  end

  def handle_event("sort", %{"field" => field}, socket) do
    field = String.to_atom(field)

    case socket.assigns.stats do
      :loading ->
        {:noreply, socket}

      stats when is_map(stats) ->
        changes =
          stats
          |> Map.get(:database, %{})
          |> Map.get(:last_n_changes, [])

        {sort_direction, sort_by} =
          if socket.assigns.sort_by == field do
            {toggle_direction(socket.assigns.sort_direction), field}
          else
            {:desc, field}
          end

        sorted_changes = sort_changes(changes, sort_by, sort_direction)

        sorted_stats =
          Map.update!(stats, :database, fn db ->
            Map.put(db, :last_n_changes, sorted_changes)
          end)

        {:noreply,
         socket
         |> assign(:stats, sorted_stats)
         |> assign(:sort_by, sort_by)
         |> assign(:sort_direction, sort_direction)}
    end
  end

  def handle_event(
        "evaluate_issues",
        _value,
        %{assigns: %{project: project, current_user: user_name}} = socket
      ) do
    socket =
      Project.check_project_authorization(project, user_name)
      |> case do
        :granted ->
          # Start the issue evaluation asynchronously, this will get picked up by a handle_info/2 above.
          Task.async(fn ->
            {:issues_task, Issues.evaluate_all(project)}
          end)

          assign(socket, :issues_evaluating?, true)

        _ ->
          redirect(socket, to: "/")
      end

    {:noreply, socket}
  end

  def handle_event("update", %{"password" => password} = _values, socket) do
    {:noreply, assign(socket, :new_password, password)}
  end

  def handle_event("delete_cache", _values, %{assigns: %{project: project}} = socket) do
    {:ok, true} = FieldHub.FileStore.clear_cache(project)

    {:noreply, assign(socket, :hide_cache_cleared_message, false)}
  end

  def handle_event(
        "delete_form_change",
        %{
          "repeat_project_name_input" => repeated_project_name,
          "delete_files_radio" => delete_files
        } = _values,
        socket
      ) do
    delete_files =
      case delete_files do
        "delete_files" ->
          true

        "keep_files" ->
          false
      end

    socket = assign(socket, :confirm_project_name, repeated_project_name)
    socket = assign(socket, :delete_files, delete_files)
    {:noreply, socket}
  end

  def handle_event(
        "delete",
        _values,
        %{assigns: %{project: project, current_user: user_name, delete_files: delete_files}} =
          socket
      ) do
    socket =
      case User.is_admin?(user_name) do
        true ->
          %{database: :deleted} = Project.delete(project, delete_files)
          :deleted = User.delete(project)

          if delete_files == false do
            {:ok, "Project database`#{project}` has been deleted successfully."}
          else
            {:ok, "Project database`#{project}` and images have been deleted successfully."}
          end

        false ->
          {:error, "You are not authorized to delete the project."}
      end
      |> case do
        {:ok, msg} ->
          socket
          |> put_flash(:info, msg)

        {:error, msg} ->
          socket
          |> put_flash(:error, msg)
      end

    {:noreply, redirect(socket, to: "/")}
  end

  def handle_event("generate_password", _values, socket) do
    {:noreply, assign(socket, :new_password, CouchService.create_password())}
  end

  def handle_event(
        "set_password",
        _values,
        %{assigns: %{project: project, current_user: user_name, new_password: new_password}} =
          socket
      ) do
    socket =
      case User.is_admin?(user_name) do
        true ->
          User.update_password(project, new_password)

        false ->
          {:error, "You are not authorized to set the password."}
      end
      |> case do
        {:error, _} = error ->
          error

        :updated ->
          {:ok, "Successfully updated the password to '#{new_password}'."}

        :unknown ->
          {:error,
           "Default user for '#{project}' seems to be missing, unable to set the password."}
      end
      |> case do
        {:ok, msg} ->
          socket
          |> put_flash(:info, msg)

        {:error, msg} ->
          socket
          |> put_flash(:error, msg)
      end

    {:noreply, socket}
  end

  def get_file_label(key) do
    case key do
      :original_image ->
        "original images"

      :thumbnail_image ->
        "thumbnail images"
    end
  end

  defp read_project_doc(%{assigns: %{project: project}} = socket) do
    project_doc =
      project
      |> Project.get_documents(["project"])
      |> case do
        [
          ok: doc
        ] ->
          doc

        _ ->
          :no_data
      end

    contact =
      case project_doc do
        %{
          "resource" => %{
            "contactPerson" => contactPerson,
            "contactMail" => contactMail
          }
        } ->
          %{
            name: contactPerson,
            mail: contactMail
          }

        _ ->
          :no_data
      end

    supervisor =
      case project_doc do
        %{
          "resource" => %{
            "projectSupervisor" => supervisor
          }
        } ->
          supervisor

        _ ->
          :no_data
      end

    staff =
      case project_doc do
        %{
          "resource" => %{
            "staff" => staff
          }
        }
        when is_list(staff) ->
          join(staff)

        _ ->
          :no_data
      end

    socket
    |> assign(:supervisor, supervisor)
    |> assign(:contact, contact)
    |> assign(:staff, staff)
  end

  defp join(staff) do
    cond do
      Enum.all?(staff, &is_binary/1) ->
        Enum.join(staff, ", ")

      Enum.all?(staff, &is_map/1) ->
        staff
        |> Stream.map(fn map ->
          Map.get(map, "value")
        end)
        |> Enum.join(", ")

      true ->
        ""
    end
    |> case do
      "" ->
        # Handles the `true` fallback above or cases where extracting values from the maps did not return any values.
        :no_data

      combined_names ->
        combined_names
    end
  end

  defp toggle_direction(:desc), do: :asc

  defp toggle_direction(:asc), do: :desc

  defp sort_changes(changes, :resource, direction) do
    Enum.sort_by(
      changes,
      fn change ->
        change
        |> Map.get("doc", %{})
        |> Map.get("resource", %{})
        |> Map.get("identifier", "")

        # |> String.capitalize()
      end,
      direction
    )
  end

  defp sort_changes(changes, :action, direction) do
    Enum.sort_by(
      changes,
      fn change ->
        change
        |> Map.get("doc", %{})
        |> Map.get("modified", [])
      end,
      direction
    )
  end

  defp sort_changes(changes, :user, direction) do
    Enum.sort_by(
      changes,
      fn change ->
        {_type, _date, user} = CouchService.extract_most_recent_change_info(change)
        user
      end,
      direction
    )
  end

  defp sort_changes(changes, :time, direction) do
    Enum.sort_by(
      changes,
      fn change ->
        case CouchService.extract_most_recent_change_info(change) do
          {_type, %DateTime{} = datetime, _user} ->
            datetime
            |> DateTime.to_unix()
          _ ->
            0
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
