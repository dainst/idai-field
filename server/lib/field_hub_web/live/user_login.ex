defmodule FieldHubWeb.UI.UserLoginLive do
  use FieldHubWeb, :live_view

  def render(assigns) do
    ~H"""
    <div class="mx-auto max-w-sm">
      <h1>
        Log in
      </h1>

      <.simple_form for={@form} id="login_form" action={~p"/ui/session/log_in"} phx-update="ignore">
        <.input field={@form[:name]} type="text" label="Name" required />
        <.input field={@form[:password]} type="password" label="Password" required />
        <:actions>
          <.button phx-disable-with="Logging in..." class="w-full">
            Log in <span aria-hidden="true">→</span>
          </.button>
        </:actions>
      </.simple_form>
    </div>
    """
  end

  def mount(_params, _session, socket) do
    name = Phoenix.Flash.get(socket.assigns.flash, :name)
    form = to_form(%{"name" => name}, as: "user")
    {:ok, assign(socket, form: form), temporary_assigns: [form: form]}
  end
end
