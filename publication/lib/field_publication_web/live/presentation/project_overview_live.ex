defmodule FieldPublicationWeb.Presentation.ProjectOverviewLive do
  use FieldPublicationWeb, :live_view

  alias FieldPublication.Publications
  alias FieldPublicationWeb.Presentation.Data.I18n

  def mount(%{"project_id" => project_identifier} = _assigns, _session, socket) do
    project_doc =
      project_identifier
      |> Publications.get_current_published()
      |> Publications.Data.get_project_info()

    {:ok, assign(socket, :project, project_doc)}
  end
end
