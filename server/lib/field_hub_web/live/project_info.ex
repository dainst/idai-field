defmodule FieldHub.ProjectInfo do
  alias FieldHub.CouchService
  use FieldHubWeb, :live_view

  alias FieldHub.{
    Project
  }

  def database_stats(project) do
    %{
      database: %{
        doc_count: doc_count,
        file_size: file_size,
        last_n_changes: last_n_changes
      }
    } = Project.evaluate_project(project, 1)

    %{date: last_change_date_time, user: last_change_user} =
      case List.first(last_n_changes) do
        nil ->
          %{date: nil, user: nil}

        change ->
          change
          |> CouchService.extract_most_recent_change_info()
          |> (fn {_type, date_time, user} -> %{date: date_time, user: user} end).()
      end

    %{
      doc_count: doc_count,
      file_size: Sizeable.filesize(file_size),
      last_change_date: last_change_date_time,
      last_change_user: last_change_user
    }
  end

end
