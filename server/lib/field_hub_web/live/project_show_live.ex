defmodule FieldHubWeb.ProjectShowLive do
  alias FieldHubWeb.{
    Router.Helpers,
    UserAuth,
    ProjectShowLiveIssues
  }

  alias FieldHub.{
    CouchService,
    Issues,
    Project,
    User
  }

  alias Phoenix.LiveView.JS

  use Phoenix.LiveView

  require Logger

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
        Process.send(self(), :update_overview, [])

        {
          :ok,
          socket
          |> assign(:supervisor, :loading)
          |> assign(:contact, :loading)
          |> assign(:staff, :loading)
          |> assign(:stats, :loading)
          |> assign(:issue_status, :idle)
          |> assign(:issues, :no_data)
          |> assign(:issue_count, 0)
          |> assign(:project, project)
          |> assign(:current_user, user_name)
          |> assign(:new_password, "")
        }

      _ ->
        redirect(socket, to: "/")
    end
  end

  def handle_info(
        :update_overview,
        %{assigns: %{project: project}} = socket
      ) do
    stats = Project.evaluate_project(project)

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
        } ->
          staff

        _ ->
          :no_data
      end

    Process.send_after(self(), :update_overview, 10000)

    {
      :noreply,
      socket
      |> assign(:supervisor, supervisor)
      |> assign(:contact, contact)
      |> assign(:staff, staff)
      |> assign(:stats, stats)
    }
  end

  def handle_info(
        :update_issues,
        %{assigns: %{project: project}} = socket
      ) do
    issues = Issues.evaluate_all(project)

    grouped =
      issues
      |> Enum.group_by(fn %{type: type, severity: severity} -> {type, severity} end)

    issue_count = Enum.count(issues)

    {
      :noreply,
      socket
      |> assign(:issues, grouped)
      |> assign(:issue_status, :idle)
      |> assign(:issue_count, issue_count)
    }
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
          Process.send(self(), :update_issues, [])

          socket
          |> assign(:issue_status, :evaluating)

        _ ->
          redirect(socket, to: "/")
      end

    {:noreply, socket}
  end

  def handle_event("update", %{"password" => password} = _values, socket) do
    {:noreply, assign(socket, :new_password, password)}
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

  def get_issue_type_label(:no_project_document), do: "No project document"
  def get_issue_type_label(:no_default_project_map_layer), do: "No default map layer"
  def get_issue_type_label(:file_directory_not_found), do: "Project file directory not found"
  def get_issue_type_label(:image_variants_size), do: "Image variants file size"
  def get_issue_type_label(:missing_image_copyright), do: "Images missing copyright information"
  def get_issue_type_label(:missing_original_image), do: "Missing original images"
  def get_issue_type_label(:unexpected_error), do: "Unexpected issue"
  def get_issue_type_label(:unresolved_relation), do: "Unresolved relation"

  def get_issue_type_label(:non_unique_identifiers),
    do: "Same identifier used for different documents"

  def get_issue_type_label(type), do: type

  def issue_classes(:info), do: "monitoring-issue info"
  def issue_classes(:warning), do: "monitoring-issue warning"
  def issue_classes(:error), do: "monitoring-issue error"
end