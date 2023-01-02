defmodule FieldHubWeb.MonitoringLive do
  alias FieldHub.User
  alias FieldHub.Issues

  alias FieldHub.{
    CouchService,
    Statistics
  }

  alias Phoenix.LiveView.JS

  use Phoenix.LiveView

  require Logger

  def mount(%{"project" => project} = params, %{"user_token" => user_token} = session, socket) do
    # TODO: In newer Phoenix version use an `on_mount` plug. This check prevents direct unauthorized
    # access via websocket. In the normal application flow this will be unnesseary
    # because the http plug will already have caught unauthorized access before switching protocols.
    # See https://hexdocs.pm/phoenix_live_view/security-model.html#mounting-considerations
    user_name =
      user_token
      |> User.get_user_by_session_token()

    user_name
    |> CouchService.has_project_access?(project)
    |> case do
      true ->
        Process.send(self(), :update, [])
        Process.send(self(), :update_issues, [])

        {
          :ok,
          socket
          |> assign(:stats, :loading)
          |> assign(:issues, :loading)
          |> assign(:active_issues, [])
          |> assign(:issue_count, 0)
          |> assign(:project, project)
          |> assign(:current_user, user_name)
        }

      false ->
        redirect(socket, to: "/login")
    end
  end

  def handle_info(:update, %{assigns: %{current_user: user_name, project: project}} = socket) do
    stats = Statistics.get_for_project(project)

    Process.send_after(self(), :update, 10000)

    {:noreply, assign(socket, :stats, stats)}
  end

  def handle_info(
        :update_issues,
        %{assigns: %{current_user: user_name, project: project, stats: stats}} = socket
      ) do
    issues = Issues.evaluate_all(project)

    grouped =
      issues
      |> Enum.group_by(fn %{type: type} -> type end)

    issue_count = Enum.count(issues)

    schedule_next_in =
      case stats do
        %{database: %{doc_count: doc_count}} ->
          ms = doc_count * 5

          case ms do
            val when val < 10000 ->
              10000

            val ->
              val
          end

        _ ->
          10000
      end

    Logger.debug("Running next issue update in #{schedule_next_in} ms.")

    Process.send_after(self(), :update_issues, schedule_next_in)

    {
      :noreply,
      socket
      |> assign(:issues, grouped)
      |> assign(:issue_count, issue_count)
    }
  end

  def handle_event(
        "toggle_issue_type",
        %{"type" => type},
        %{assigns: %{active_issues: active_issues}} = socket
      ) do
    atomized_type = String.to_existing_atom(type)

    updated_issues =
      active_issues
      |> Enum.member?(atomized_type)
      |> case do
        true ->
          List.delete(active_issues, atomized_type)

        false ->
          active_issues ++ [atomized_type]
      end

    {:noreply, assign(socket, :active_issues, updated_issues)}
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
      "#{key}: #{value}"
    end)
    |> Enum.join(", ")
    |> case do
      "" ->
        "No description available"

      val ->
        val
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
  def issue_classes(_), do: "monitoring-issue"
end
