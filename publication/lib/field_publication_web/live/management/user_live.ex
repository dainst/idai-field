defmodule FieldPublicationWeb.Management.UserLive do
  use FieldPublicationWeb, :live_view

  alias FieldPublication.User
  alias FieldPublicationWeb.Management.Modals.UserFormComponent

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
    |> assign(:page_title, "Listing users")
  end

  defp apply_action(socket, :edit, %{"name" => name}) do
    {:ok, user} = User.get(name)

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
    User.delete(name)

    {
      :noreply,
      socket |> assign(:users, User.list())
    }
  end

  @impl true
  def handle_info({UserFormComponent, {:saved, _user}}, socket) do
    {:noreply, assign(socket, :users, User.list())}
  end
end
