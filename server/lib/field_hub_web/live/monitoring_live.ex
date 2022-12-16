defmodule FieldHubWeb.MonitoringLive do
  alias FieldHub.Issues
  alias FieldHub.{
    CouchService,
    Statistics
  }

  use Phoenix.LiveView

  require Logger

  def mount(%{"project" => project}, %{"user" => user, "password" => password}, socket) do

    credentials =
      %CouchService.Credentials{
        name: user,
        password: password
      }

   Process.send(self(), :update, [])
   Process.send(self(), :update_issues, [])

    {
      :ok,
      socket
      |> assign(:stats, :loading)
      |> assign(:issues, :loading)
      |> assign(:project, project)
      |> assign(:credentials, credentials)
    }
  end

  def handle_info(:update, %{assigns: %{credentials: credentials, project: project}} = socket) do

    stats =
      credentials
      |> Statistics.get_for_project(project)

    Process.send_after(self(), :update, 1000)

    {:noreply, assign(socket, :stats, stats)}
  end

  def handle_info(:update_issues, %{assigns: %{credentials: credentials, project: project}} = socket) do

    issues =
      credentials
      |> Issues.check_file_store(project)

    timer =
      case Enum.count(issues) * 10 do
        count when count < 1000 ->
          1000
        count ->
          count
      end

    grouped =
      issues
      |> Enum.group_by(fn(%{type: type}) -> type end)

    Logger.debug("Running next issue update in #{timer} ms.")

    Process.send_after(self(), :update_issues, timer)

    {:noreply, assign(socket, :issues, grouped)}
  end

  def get_file_label(key) do
    case key do
      :original_image ->
        "original images"
      :thumbnail_image ->
        "thumbnail images"
    end
  end

  def get_issue_type_label(:image_variant_sizes), do: "Image variant file size"
  def get_issue_type_label(:missing_original_image), do: "Missing original images"
  def get_issue_type_label(:missing_thumbnail_image), do: "Missing thumbnail images"
  def get_issue_type_label(type), do: type

  def issue_classes(:info), do: "monitoring-issue-info"
  def issue_classes(:warning), do: "monitoring-issue-warning"
  def issue_classes(:error), do: "monitoring-issue-error"
  def issue_classes(_), do: ""
end
