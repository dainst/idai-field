defmodule FieldPublicationWeb.UserLoginLive do
  use FieldPublicationWeb, :live_view

  def render(assigns) do
    ~H"""
    <div class="mx-auto max-w-sm">
      <.document_heading class="text-center">
        Sign in to account
      </.document_heading>

      <.simple_form for={@form} id="login_form" action={~p"/log_in"} phx-update="ignore">
        <.input field={@form[:name]} type="text" label="Name" required />
        <.input field={@form[:password]} type="password" label="Password" required />

        <:actions>
          <.input field={@form[:remember_me]} type="checkbox" label="Keep me logged in" />
        </:actions>
        <:actions>
          <.button phx-disable-with="Signing in..." class="w-full">
            Sign in <span aria-hidden="true">→</span>
          </.button>
        </:actions>
      </.simple_form>
    </div>
    """
  end

  def mount(_params, _session, socket) do
    name = Phoenix.Flash.get(socket.assigns.flash, :name)
    form = to_form(%{"name" => name}, as: "user")

    {
      :ok,
      socket
      |> assign(form: form)
      |> assign(:page_title, "Login"),
      temporary_assigns: [form: form]
    }
  end
end
