defmodule FieldPublicationWeb.PublicationLive.ReplicationFormComponent do
  alias FieldPublication.Replication
  use FieldPublicationWeb, :live_component

  alias FieldPublication.Schemas.{
    Project,
    ReplicationInput
  }

  @impl true
  def render(assigns) do
    ~H"""
    <div>
      <.header>
        Create publication draft for <i><%= @project.name %></i>
      </.header>

      <.simple_form
        for={@form}
        id="replication-form"
        phx-change="validate"
        phx-submit="start"
        phx-target={@myself}
      >
        <h2 class="text-2xl">Connection data</h2>
        <div :if={@initialization_error} class="border-red-800 bg-red-200 p-2 border-2 rounded">
          <%= @initialization_error %>
        </div>
        <.input field={@form[:source_url]} type="url" label="Source URL" />
        <.input field={@form[:source_project_name]} type="text" label="Source project name" />
        <.input field={@form[:source_user]} type="text" label="Source user name" />
        <.input field={@form[:source_password]} type="password" label="Source user password" />
        <.input field={@form[:project_name]} type="hidden" />
        <.input
          field={@form[:delete_existing_publication]}
          type="checkbox"
          label="Delete existing publication"
        />

        <h2 class="text-2xl">Publication comments</h2>
        <.live_component
          module={FieldPublicationWeb.TranslationLive.FormComponent}
          id={@form[:comments]}
          form_field={@form[:comments]}
          add="add_comment"
          remove="remove_comment"
          target={@myself}
        />
        <:actions>
          <.button phx-disable-with="Initializing...">Start replication</.button>
        </:actions>
      </.simple_form>
    </div>
    """
  end

  @impl true
  def update(%{id: project_id, patch: patch_route}, socket) do
    project = Project.get!(project_id)

    changeset =
      %ReplicationInput{}
      |> ReplicationInput.changeset(%{
        source_project_name: project.name,
        source_user: project.name,
        project_name: project.name,
        comments: []
      })

    {
      :ok,
      socket
      |> assign(:page_title, "Create new publication")
      |> assign(:project, project)
      |> assign(:initialization_error, nil)
      |> assign(:patch, patch_route)
      |> assign(:form, to_form(changeset))
    }
  end

  @impl true
  def handle_event("validate", %{"replication_input" => replication_params}, socket) do
    changeset =
      %ReplicationInput{}
      |> ReplicationInput.changeset(replication_params)
      |> Map.put(:action, :validate)
      |> IO.inspect()

    {
      :noreply,
      socket
      |> assign(:initialization_error, nil)
      |> assign(:form, to_form(changeset))
    }
  end

  @impl true
  def handle_event("add_comment", _, %{assigns: %{form: %{source: changeset}}} = socket) do
    current_comments = Ecto.Changeset.get_field(changeset, :comments)

    changeset =
      Ecto.Changeset.put_embed(
        changeset,
        :comments,
        current_comments ++ [%{text: "", language: ""}]
      )

    {
      :noreply,
      socket
      |> assign(:form, to_form(changeset))
    }
  end

  @impl true
  def handle_event(
        "remove_comment",
        %{"id" => "parameters_comments_" <> id},
        %{assigns: %{form: %{source: changeset}}} = socket
      ) do
    {index, _remainder} = Integer.parse(id)

    updated_comments =
      changeset
      |> Ecto.Changeset.get_field(:comments)
      |> List.delete_at(index)

    changeset =
      changeset
      |> Ecto.Changeset.put_embed(:comments, updated_comments)

    {
      :noreply,
      socket
      |> assign(:form, to_form(changeset))
    }
  end

  def handle_event("start", %{"replication_input" => replication_params}, socket) do
    socket =
      replication_params
      |> ReplicationInput.create()
      |> case do
        {:error, changeset} ->
          socket
          |> assign(:form, to_form(changeset))

        {:ok, parameters} ->
          Replication.start(parameters)
          |> case do
            {:ok, %{publication: publication}, _pid} ->
              socket
              |> put_flash(:info, "Publication created")
              |> push_navigate(
                to:
                  ~p"/edit/#{socket.assigns.project.name}/publication/#{Date.to_string(publication.draft_date)}"
              )

            {:error, %Ecto.Changeset{} = changeset} ->
              socket
              |> assign(:form, to_form(changeset))

            {:error, msg} ->
              socket
              |> assign(:initialization_error, msg)
          end
      end

    {:noreply, socket}
  end
end
