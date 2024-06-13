defmodule FieldPublicationWeb.Management.UserLive do
  use FieldPublicationWeb, :live_view

  alias FieldPublication.Users
  alias FieldPublication.DocumentSchema.User
  alias FieldPublicationWeb.Management.UserLive.FormComponent

  @impl true
  def render(assigns) do
    ~H"""
    <h1>Manage users</h1>

    <p class="font-semibold"><%= gettext("Actions") %></p>

    <ul>
      <li>
        <.link patch={~p"/management/users/new"}>
          <%= gettext("Add user") %>
        </.link>
      </li>
    </ul>

    <%= if @users != [] do %>
      <table class="w-full mt-8">
        <thead>
          <tr>
            <th class="text-left"><%= gettext("Name") %></th>
            <th class="text-left"><%= gettext("Label") %></th>
            <th class="text-right"><%= gettext("Actions") %></th>
          </tr>
        </thead>
        <tbody class="divide-y border-t">
          <%= for user <- @users do %>
            <tr class="group hover:bg-slate-50">
              <td class="text-left"><%= user.name %></td>
              <td class="text-left"><%= user.label %></td>
              <td class="text-right">
                <div class="space-x-4">
                  <span>
                    <.link navigate={~p"/management/users/#{user.name}/edit"}>
                      <%= gettext("Edit") %>
                    </.link>
                  </span>
                  <span>
                    <.link
                      phx-click={
                        JS.push("delete", value: %{name: user.name})
                        |> hide("##{user.name}")
                      }
                      data-confirm="Are you sure?"
                    >
                      <%= gettext("Delete") %>
                    </.link>
                  </span>
                </div>
              </td>
            </tr>
          <% end %>
        </tbody>
      </table>
    <% end %>

    <.back navigate={~p"/management"}><%= gettext("Back to management") %></.back>

    <.modal
      :if={@live_action in [:new, :edit]}
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
      assign(socket, :users, Users.list())
    }
  end

  @impl true
  def handle_params(params, _url, socket) do
    {:noreply, apply_action(socket, socket.assigns.live_action, params)}
  end

  defp apply_action(socket, :index, _params) do
    socket
    |> assign(:page_title, "Listing users")
  end

  defp apply_action(socket, :edit, %{"name" => name}) do
    {:ok, user} = Users.get(name)

    socket
    |> assign(:page_title, "Edit user '#{name}'")
    |> assign(:user, user)
  end

  defp apply_action(socket, :new, _params) do
    socket
    |> assign(:page_title, "New user")
    |> assign(:user, %User{})
  end

  @impl true
  def handle_event("delete", %{"name" => name}, socket) do
    Users.delete(name)

    {
      :noreply,
      socket |> assign(:users, Users.list())
    }
  end

  @impl true
  def handle_info({FormComponent, {:saved, _user}}, socket) do
    {:noreply, assign(socket, :users, Users.list())}
  end
end
