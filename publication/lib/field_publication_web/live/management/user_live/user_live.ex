defmodule FieldPublicationWeb.Management.UserLive do
  use FieldPublicationWeb, :live_view

  alias FieldPublication.User
  alias FieldPublicationWeb.Management.UserLive.FormComponent

  @impl true
  def render(assigns) do
    ~H"""
    <h1>Manage users</h1>

    <p class="font-semibold">Actions</p>

    <ul>
      <li>
        <.link patch={~p"/management/users/new"}>
          Add User
        </.link>
      </li>
    </ul>

    <table class="w-full mt-8">
      <thead>
        <tr>
          <th class="text-left">Username</th>
          <th class="text-right"><%= gettext("Actions") %></th>
        </tr>
      </thead>
      <tbody class="divide-y border-t">
        <%= for user <- @users do %>
          <tr class="group hover:bg-slate-50">
            <td class="text-left"><%= user.name %></td>
            <td class="text-right">
              <div class="space-x-4">
                <span>
                  <.link navigate={~p"/management/users/#{user.name}/new_password"}>
                    New password
                  </.link>
                </span>
                <span>
                  <.link
                    phx-click={JS.push("delete", value: %{name: user.name}) |> hide("##{user.name}")}
                    data-confirm="Are you sure?"
                  >
                    Delete
                  </.link>
                </span>
              </div>
            </td>
          </tr>
        <% end %>
      </tbody>
    </table>

    <.back navigate={~p"/management"}>Back to management</.back>

    <.modal
      :if={@live_action in [:new, :new_password]}
      id="user-modal"
      show
      on_cancel={JS.patch(~p"/management/users")}
    >
      <.live_component
        module={FormComponent}
        id={@user.name || :new}
        title={@page_title}
        action={@live_action}
        user={@user}
        patch={~p"/management/users"}
      />
    </.modal>
    """
  end

  @impl true
  def mount(_params, _session, socket) do
    {
      :ok,
      assign(socket, :users, User.list())
    }
  end

  @impl true
  def handle_params(params, _url, socket) do
    {:noreply, apply_action(socket, socket.assigns.live_action, params)}
  end

  defp apply_action(socket, :index, _params) do
    socket
    |> assign(:page_title, "Listing Projects")
  end

  defp apply_action(socket, :new_password, %{"name" => name}) do
    socket
    |> assign(:page_title, "Edit User '#{name}'")
    |> assign(:user, User.get(name))
  end

  defp apply_action(socket, :new, _params) do
    socket
    |> assign(:page_title, "New user")
    |> assign(:user, %User.InputSchema{})
  end

  @impl true
  def handle_event("delete", %{"name" => name}, socket) do
    User.delete(name)

    {
      :noreply,
      socket |> assign(:users, User.list())
    }
  end

  @impl true
  def handle_info({FormComponent, {:saved, _user}}, socket) do
    {:noreply, assign(socket, :users, User.list())}
  end
end
