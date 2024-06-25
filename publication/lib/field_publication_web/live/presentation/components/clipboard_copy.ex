defmodule FieldPublicationWeb.Presentation.Components.ClipboardCopy do
  use FieldPublicationWeb, :live_component

  @impl true
  def render(assigns) do
    ~H"""
    <a class="cursor-pointer" id={@id} phx-hook="CopyToClipboard" valueToCopy={@copy_value}>
      <%= render_slot(@inner_block) %>
      <%= if @copied do %>
        <.icon class="text-green-500" name="hero-clipboard-document-check" />
      <% else %>
        <.icon name="hero-clipboard-document" />
      <% end %>
    </a>
    """
  end

  @impl true
  def update(assigns, socket) do
    {
      :ok,
      socket
      |> assign(assigns)
      |> assign(:copied, false)
    }
  end

  @impl
  def handle_event("link-copied", _, socket) do
    {
      :noreply,
      assign(socket, :copied, true)
    }
  end
end
