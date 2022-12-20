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

  def handle_info(:update_issues, %{assigns: %{credentials: credentials, project: project, stats: stats}} = socket) do

    issues =
      credentials
      |> Issues.evaluate_all(project)

    grouped =
      issues
      |> Enum.group_by(fn(%{type: type}) -> type end)

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

  def get_file_label(key) do
    case key do
      :original_image ->
        "original images"
      :thumbnail_image ->
        "thumbnail images"
    end
  end

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
  def get_issue_description(%{type: :image_variants_size, data: %{original_size: original, thumbnail_size: thumbnail} = data}) do
    extended_description =
      "The original image (#{Sizeable.filesize(original)}) should be greater than the thumbnail (#{Sizeable.filesize(thumbnail)}). "
    "#{generic_file_description(data)} #{extended_description}"
  end

  defp generic_file_description(%{file_name: file_name, file_type: file_type, created_by: created_by, created: created}) do
    "'#{file_name}' (#{file_type}), created by #{created_by} on #{created}."
  end

  def issue_classes(:info), do: "monitoring-issue info"
  def issue_classes(:warning), do: "monitoring-issue warning"
  def issue_classes(:error), do: "monitoring-issue error"
  def issue_classes(_), do: "monitoring-issue"
end
