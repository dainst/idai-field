defmodule FieldHubWeb.Live.UserLogin do
  use FieldHubWeb, :live_view

  def mount(_params, _session, socket) do
    name = Phoenix.Flash.get(socket.assigns.flash, :name)
    form = to_form(%{"name" => name}, as: "user")

    {
      :ok,
      socket
      |> assign(form: form)
      |> assign(:page_title, "Log in"),
      temporary_assigns: [form: form]
    }
  end
end
