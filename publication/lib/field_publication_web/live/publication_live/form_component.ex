defmodule FieldPublicationWeb.PublicationLive.FormComponent do
  use FieldPublicationWeb, :live_component

  alias FieldPublication.Schema.Publication

  @impl true
  def render(assigns) do
    ~H"""
    <div>
      <.header>
        <%= @title %>
      </.header>

      <.simple_form
        for={@form}
        id="project-form"
        phx-target={@myself}
        phx-change="validate"
        phx-submit="save"
      >
        <.input type="hidden" field={@form[:draft_date]}/>
        <.input type="hidden" field={@form[:source_url]}/>
        <.input type="hidden" field={@form[:source_project_name]}/>
        <.input type="hidden" field={@form[:configuration_doc]}/>
        <.input type="hidden" field={@form[:database]}/>
        <.input type="date" label="Publication date" field={@form[:publication_date]}/>

        <.label>Publication comments</.label>
        <.live_component
          module={FieldPublicationWeb.TranslationLive.FormComponent}
          id={@form[:comments]}
          form_field={@form[:comments]}
          add={"add_comment"}
          remove={"remove_comment"}
          target={@myself}
        />
        <:actions>
          <.button phx-disable-with="Saving...">Save Publication</.button>
        </:actions>
      </.simple_form>
    </div>
    """
  end

  @impl true
  def update(%{publication: publication} = assigns, socket) do
    changeset = Publication.changeset(publication)

    {
      :ok,
      socket
      |> assign(assigns)
      |> assign_form(changeset)
    }
  end

  @impl true
  def handle_event("validate", %{"publication" => form_params}, socket) do
    changeset =
      socket.assigns.publication
      |> Publication.changeset(form_params)
      |> Map.put(:action, :validate)

    {:noreply, assign_form(socket, changeset)}
  end

  def handle_event("save", %{ "publication" => publication_form_params}, socket) do
    socket.assigns.publication
    |> Publication.update(publication_form_params)
    |> case do
      {:ok, updated_publication} ->
        notify_parent({:updated_publication, updated_publication})
        {
          :noreply,
          socket
          |> put_flash(:info, "Publication updated successfully")
          |> push_patch(to: socket.assigns.patch)
        }

      {:error, %Ecto.Changeset{} = changeset} ->
        {:noreply, assign_form(socket, changeset)}
    end
  end

  @impl true
  def handle_event("add_comment", _, %{assigns: %{form: %{source: changeset}}} = socket) do
    current_comments = Ecto.Changeset.get_field(changeset, :comments)

    changeset =
      Ecto.Changeset.put_embed(changeset, :comments, current_comments ++ [%{text: "", language: ""}])

    {
      :noreply,
      socket
      |> assign(:form, to_form(changeset))
    }
  end

  @impl true
  def handle_event("remove_comment", %{"id" => "parameters_comments_" <> id}, %{assigns: %{form: %{source: changeset}}} = socket) do
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

  defp assign_form(socket, %Ecto.Changeset{} = changeset) do
    assign(socket, :form, to_form(changeset))
  end

  defp notify_parent(msg), do: send(self(), {__MODULE__, msg})
end
