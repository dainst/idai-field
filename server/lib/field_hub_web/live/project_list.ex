defmodule FieldHubWeb.Live.ProjectList do

use FieldHubWeb, :live_view

alias FieldHub.{
    Project,
    User
  }

  def mount(_params, _session, %{assigns: %{current_user: current_user}} = socket) do
    socket =
      case current_user do
        nil ->
          socket

        user_name when is_binary(user_name) ->
          projects = Project.get_all_for_user(user_name)

          assign(socket, :projects, projects)
      end

    {:ok, assign(socket, :page_title, "Overview")}
  end



  defp database_stats(project) do
    %{database: %{doc_count: doc_counts, file_size: file_size}} =
    Project.evaluate_project(project)

    %{doc_counts: doc_counts, file_size: file_size}
  end

end
