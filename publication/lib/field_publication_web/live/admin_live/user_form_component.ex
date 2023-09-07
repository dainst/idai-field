defmodule FieldPublicationWeb.AdminLive.UserFormComponent do
  use FieldPublicationWeb, :live_component

  alias FieldPublication.CouchService
  alias FieldPublication.User

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
        <%= case @action do %>
          <% :new_password -> %>
            <.input field={@form[:name]} type="hidden" />
            <div class="relative">
              <.input field={@form[:password]} type="text" label=" New Password" />
              <.button
                type="button"
                phx-click="generate_password"
                phx-target={@myself}
                class="absolute right-0 bottom-0 border-2 rounded-l-none"
              >
                Generate
              </.button>
            </div>
          <% :new -> %>
            <.input field={@form[:name]} type="text" label="Name" />
            <div class="relative">
              <.input field={@form[:password]} type="text" label="Password" />
              <.button
                type="button"
                phx-click="generate_password"
                phx-target={@myself}
                class="absolute right-0 bottom-0 border-2 rounded-l-none"
              >
                Generate
              </.button>
            </div>
          <% _ -> %>
        <% end %>
        <:actions>
          <.button phx-disable-with="Saving...">Save User</.button>
        </:actions>
      </.simple_form>
    </div>
    """
  end

  @impl true
  def update(%{user: user} = assigns, socket) do
    changeset = User.InputSchema.changeset(user) |> IO.inspect()

    {
      :ok,
      socket
      |> assign(assigns)
      |> assign(:form, to_form(changeset))
    }
  end

  @impl true
  def handle_event("validate", %{"input_schema" => form_params}, socket) do
    changeset =
      socket.assigns.user
      |> User.InputSchema.changeset(form_params)
      |> Map.put(:action, :validate)

    {:noreply, assign(socket, :form, to_form(changeset))}
  end

  def handle_event("generate_password", _, %{assigns: %{form: %{source: source}}} = socket) do
    changeset =
      source
      |> Ecto.Changeset.put_change(:password, CouchService.generate_password())

    {:noreply, assign(socket, :form, to_form(changeset))}
  end

  def handle_event("save", %{"input_schema" => form_params}, socket) do
    save_user(socket, socket.assigns.action, form_params)
  end

  defp save_user(socket, :new_password, form_params) do
    User.update(socket.assigns.user, form_params |> IO.inspect())
    |> case do
      {:error, changeset} ->
        {:noreply, assign(socket, :form, to_form(changeset))}

      %{name: name} ->
        notify_parent({:saved, name})

        {
          :noreply,
          socket
          |> put_flash(:info, "New user password successfully set.")
          |> push_patch(to: socket.assigns.patch)
        }
    end
  end

  defp save_user(socket, :new, form_params) do
    User.create(form_params |> IO.inspect())
    |> case do
      {:error, changeset} ->
        IO.inspect(changeset)

        {:noreply, assign(socket, :form, to_form(changeset))}

      %{name: name} ->
        notify_parent({:saved, name})

        {
          :noreply,
          socket
          |> put_flash(:info, "User created successfully")
          |> push_patch(to: socket.assigns.patch)
        }
    end
  end

  defp notify_parent(msg), do: send(self(), {__MODULE__, msg})
end
