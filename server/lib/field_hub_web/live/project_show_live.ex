defmodule FieldHubWeb.ProjectShowLive do
  alias FieldHubWeb.{
    Router.Helpers,
    UserAuth
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
        Process.send(self(), :update_stats, [])

        {
          :ok,
          socket
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
        :update_stats,
        %{assigns: %{project: project}} = socket
      ) do
    stats = Project.evaluate_project(project)

    Process.send_after(self(), :update_stats, 10000)

    {:noreply, assign(socket, :stats, stats)}
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
  def get_issue_type_label(:missing_original_image), do: "Missing original images"
  def get_issue_type_label(:unexpected_error), do: "Unexpected issue"
  def get_issue_type_label(:unresolved_relation), do: "Unresolved relation"

  def get_issue_type_label(:non_unique_identifiers),
    do: "Same identifier used for different documents"

  def get_issue_type_label(type), do: type

  def get_issue_description(%{type: :file_directory_not_found, data: %{path: path}}) do
    "File directory '#{path}' for the project not found!"
  end

  def get_issue_description(%{type: :missing_original_image, data: data}) do
    "#{generic_file_description(data)} Original file is missing and should be uploaded."
  end

  def get_issue_description(%{
        type: :image_variants_size,
        data: %{original_size: original, thumbnail_size: thumbnail} = data
      }) do
    extended_description =
      "The original image (#{Sizeable.filesize(original)}) should be greater than the thumbnail (#{Sizeable.filesize(thumbnail)}). "

    "#{generic_file_description(data)} #{extended_description}"
  end

  def get_issue_description(%{
        type: :unresolved_relation,
        data: %{
          uuid: uuid,
          unresolved_relations: list_of_uuids
        }
      }) do
    "Document `#{uuid}` relates to missing documents with `#{Enum.join(list_of_uuids, ", ")}`."
  end

  def get_issue_description(%{type: :no_default_project_map_layer}) do
    "There is no default map layer defined for the project."
  end

  def get_issue_description(%{type: :no_project_document}) do
    "Could not find a project document in the database!"
  end

  def get_issue_description(%{data: data}) do
    # fallback: output key/value pairs
    data
    |> Enum.map(fn {key, value} ->
      "#{key}: #{inspect(value, pretty: true)}"
    end)
    |> Enum.join(", ")
    |> case do
      "" ->
        "No description available"

      val ->
        {:preformatted, val}
    end
  end

  defp generic_file_description(%{
         file_name: file_name,
         file_type: file_type,
         created_by: created_by,
         created: created
       }) do
    "'#{file_name}' (#{file_type}), created by #{created_by} on #{created}."
  end

  def issue_classes(:info), do: "monitoring-issue info"
  def issue_classes(:warning), do: "monitoring-issue warning"
  def issue_classes(:error), do: "monitoring-issue error"
end
