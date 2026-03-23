defmodule FieldPublicationWeb.Management.Modals.UserFormComponent do
  use FieldPublicationWeb, :live_component

  alias FieldPublication.CouchService
  alias FieldPublication.Users
  alias FieldPublication.DatabaseSchema.User

  @impl true
  def render(assigns) do
    ~H"""
    <div>
      <.document_heading>
        {@title}
      </.document_heading>

      <.simple_form
        for={@form}
        id="user-form"
        phx-target={@myself}
        phx-change="validate"
        phx-submit="save"
      >
          <%= case @action do %>
            <% :edit -> %>
              <.input field={@form[:name]} type="hidden" />
            <% :new -> %>
              <.input field={@form[:name]} type="text" label="User name" />
          <% end %>
          <.input field={@form[:label]} type="text" label="Full name" />
          <.input field={@form[:password]} type="text" label="New Password" />

          <button
            class="border cursor-pointer border-primary hover:border-primary-hover p-2 w-full"
            type="button"
            phx-click="generate_password"
            phx-target={@myself}
          >
            Generate new password
          </button>
        <:actions>
          <.button class="w-full" phx-disable-with="Saving...">Save User</.button>
        </:actions>
      </.simple_form>
    </div>
    """
  end

  @impl true
  def update(%{user: user} = assigns, socket) do
    changeset = User.changeset(user)

    {
      :ok,
      socket
      |> assign(assigns)
      |> assign(:form, to_form(changeset))
    }
  end

  @impl true
  def handle_event("validate", %{"user" => form_params}, socket) do
    changeset =
      socket.assigns.user
      |> User.changeset(form_params)
      |> Map.put(:action, :validate)

    {:noreply, assign(socket, :form, to_form(changeset))}
  end

  def handle_event("generate_password", _, %{assigns: %{form: %{source: source}}} = socket) do
    changeset =
      source
      |> Ecto.Changeset.put_change(:password, CouchService.generate_password())

    {:noreply, assign(socket, :form, to_form(changeset))}
  end

  def handle_event("save", %{"user" => form_params}, socket) do
    save_user(socket, socket.assigns.action, form_params)
  end

  defp save_user(socket, :edit, form_params) do
    Users.update(socket.assigns.user, form_params)
    |> case do
      {:error, changeset} ->
        {:noreply, assign(socket, :form, to_form(changeset))}

      {:ok, %{name: name}} ->
        notify_parent({:saved, name})

        {
          :noreply,
          push_patch(socket, to: socket.assigns.patch)
        }
    end
  end

  defp save_user(socket, :new, form_params) do
    Users.create(form_params)
    |> case do
      {:error, changeset} ->
        {:noreply, assign(socket, :form, to_form(changeset))}

      {:ok, %{name: name}} ->
        notify_parent({:saved, name})

        {
          :noreply,
          push_patch(socket, to: socket.assigns.patch)
        }
    end
  end

  defp notify_parent(msg), do: send(self(), {__MODULE__, msg})
end
