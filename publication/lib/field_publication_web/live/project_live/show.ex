defmodule FieldPublicationWeb.ProjectLive.Show do
  use FieldPublicationWeb, :live_view

  alias FieldPublication.Projects
  alias FieldPublication.Publications

  alias FieldPublication.Schemas.Publication
  alias FieldPublication.Schemas.ReplicationInput

  @impl true
  def mount(%{"project_id" => id}, _session, socket) do
    project = Projects.get!(id)
    publications = Publications.list(project)

    {
      :ok,
      socket
      |> assign(:today, Date.utc_today())
      |> assign(:publications, [])
      |> assign(:page_title, page_title(socket.assigns.live_action))
      |> assign(:project, project)
      |> assign(:publications, publications)
    }
  end

  @impl true
  def handle_info({FieldPublicationWeb.ProjectLive.FormComponent, {:saved, project}}, socket) do
    {:noreply, assign(socket, :project, project)}
  end

  @impl true
  def handle_info(
        {FieldPublicationWeb.PublicationLive.ReplicationFormComponent,
         {%ReplicationInput{} = params, %Publication{} = publication}},
        socket
      ) do
    FieldPublication.Replication.start(
      params,
      publication
    )

    {
      :noreply,
      socket
      |> put_flash(:info, "Publication created")
      |> push_navigate(
        to: ~p"/edit/#{publication.project_name}/publication/#{publication.draft_date}"
      )
    }
  end

  defp page_title(:show), do: "Show Project"
  defp page_title(:edit), do: "Edit Project"
  defp page_title(:draft_publication), do: "Draft publication"
end
