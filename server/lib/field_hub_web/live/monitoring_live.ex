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
      |> assign(:issue_count, 0)
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
      |> Issues.evaluate_all(project)

    issue_count = Enum.count(issues)

    timer =
      case issue_count * 10 do
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


    {
      :noreply,
      socket
      |> assign(:issues, grouped)
      |> assign(:issue_count, issue_count)
    }
  end

  def get_file_label(key) do
    case key do
      :original_image ->
        "original images"
      :thumbnail_image ->
        "thumbnail images"
    end
  end

  def get_issue_type_label(:image_variants_size), do: "Image variants file size"
  def get_issue_type_label(:missing_original_image), do: "Missing original images"
  def get_issue_type_label(type), do: type

  def get_issue_description(%{type: :missing_original_image, data: data}) do
    "#{generic_file_description(data)} Original file is missing and should be uploaded."
  end
  def get_issue_description(%{type: :image_variants_size, data: %{original_size: original, thumbnail_size: thumbnail} = data}) do
    extended_description =
      "The original image (#{Sizeable.filesize(original)}) should be greater than the thumbnail (#{Sizeable.filesize(thumbnail)}). "
    "#{generic_file_description(data)} #{extended_description}"
  end

  defp generic_file_description(%{file_name: file_name, file_type: file_type, created_by: created_by, created: created}) do
    "'#{file_name}' (#{file_type}), created by #{created_by} on #{created}."
  end

  def issue_classes(:info), do: "monitoring-issue-info"
  def issue_classes(:warning), do: "monitoring-issue-warning"
  def issue_classes(:error), do: "monitoring-issue-error"
  def issue_classes(_), do: ""
end
