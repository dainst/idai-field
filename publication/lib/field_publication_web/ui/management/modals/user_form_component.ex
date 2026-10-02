defmodule FieldPublicationWeb.UI.Management.Modals.UserFormComponent do
  use FieldPublicationWeb, :live_component

  alias FieldPublication.CouchService
  alias FieldPublication.User

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
        <.input field={@form[:email]} type="text" label="Email" />
        <.input field={@form[:password]} type="password" label="New Password" />
        <.input field={@form[:admin?]} type="checkbox" label="Administrator" />

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
  def handle_event(
        "validate",
        %{"user" => form_params},
        %{assigns: %{user: %User{} = user}} = socket
      ) do
    changeset =
      User.changeset(user, form_params, socket.assigns.action == :new)

    {:noreply, assign(socket, :form, to_form(changeset))}
  end

  def handle_event("generate_password", _params, %{assigns: %{form: %{params: params}}} = socket) do
    form =
      %User{}
      |> User.changeset(Map.put(params, "password", CouchService.generate_password()))
      |> to_form()

    {
      :noreply,
      assign(
        socket,
        :form,
        form
      )
    }
  end

  def handle_event("save", %{"user" => form_params}, socket) do
    save_user(socket, form_params)
  end

  defp save_user(%{assigns: %{user: %User{} = user, action: :edit}} = socket, form_params) do
    user
    |> User.update(form_params)
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

  defp save_user(socket, form_params) do
    # New user.
    User.create(form_params)
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
