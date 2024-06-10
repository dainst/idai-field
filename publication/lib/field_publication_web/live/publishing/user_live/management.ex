defmodule FieldPublicationWeb.Publishing.UserLive.Management do
  use FieldPublicationWeb, :live_view

  alias FieldPublication.User
  alias FieldPublicationWeb.Publishing.UserLive.FormComponent

  @impl true
  def render(assigns) do
    ~H"""
    <.header>
      Listing Users
      <:actions>
        <.link patch={~p"/publishing/users/new"}>
          <.button>New User</.button>
        </.link>
      </:actions>
    </.header>

    <table class="w-[40rem] mt-11 sm:w-full">
      <thead class="text-sm text-left leading-6 text-zinc-500">
        <tr>
          <th>Username</th>
          <th class="relative p-0 pb-4"><span class="sr-only"><%= gettext("Actions") %></span></th>
        </tr>
      </thead>
      <tbody class="relative divide-y divide-zinc-100 border-t border-zinc-200 text-sm leading-6 text-zinc-700">
        <%= for user <- @users do %>
          <tr class="group hover:bg-zinc-50">
            <td><%= user.name %></td>
            <td>
              <div class="relative whitespace-nowrap py-4 text-right text-sm font-medium">
                <span class="relative ml-4 font-semibold leading-6 text-zinc-900 hover:text-zinc-700">
                  <.link navigate={~p"/publishing/users/#{user.name}/new_password"}>
                    New password
                  </.link>
                </span>
                <span class="relative ml-4 font-semibold leading-6 text-zinc-900 hover:text-zinc-700">
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

    <.back navigate={~p"/"}>To projects</.back>

    <.modal
      :if={@live_action in [:new, :new_password]}
      id="user-modal"
      show
      on_cancel={JS.patch(~p"/publishing/users")}
    >
      <.live_component
        module={FormComponent}
        id={@user.name || :new}
        title={@page_title}
        action={@live_action}
        user={@user}
        patch={~p"/publishing/users"}
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
