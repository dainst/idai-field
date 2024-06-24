defmodule FieldPublicationWeb.Management.UserLive.FormComponent do
  use FieldPublicationWeb, :live_component

  alias FieldPublication.CouchService
  alias FieldPublication.Users
  alias FieldPublication.DocumentSchema.User

  @impl true
  def render(assigns) do
    ~H"""
    <div>
      <.header>
        <%= @title %>
      </.header>

      <.simple_form
        for={@form}
        id="user-form"
        phx-target={@myself}
        phx-change="validate"
        phx-submit="save"
      >
        <div class="relative">
          <%= case @action do %>
            <% :edit -> %>
              <.input field={@form[:name]} type="hidden" />
            <% :new -> %>
              <.input field={@form[:name]} type="text" label="Name" />
          <% end %>
          <.input field={@form[:label]} type="text" label="Label" />
          <.input class="relative" field={@form[:password]} type="text" label="New Password" />
          <.button
            type="button"
            phx-click="generate_password"
            phx-target={@myself}
            class="absolute right-0 bottom-0 border-2 rounded-l-none"
          >
            Generate
          </.button>
        </div>
        <:actions>
          <.button phx-disable-with="Saving...">Save User</.button>
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
