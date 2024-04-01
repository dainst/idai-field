defmodule FieldPublicationWeb.Presentation.Components.GenericField do
  use Phoenix.Component

  require Logger
  alias FieldPublicationWeb.Presentation.Components.I18n

  def render(%{type: single_value} = assigns)
      when single_value in ["input", "unsignedInt", "date", "radio", "text"] do
    ~H"""
    <dt class="font-bold"><I18n.text values={@labels} /></dt>
    <dd class="ml-4"><%= @values %></dd>
    """
  end

  def render(%{type: "checkboxes"} = assigns) do
    ~H"""
    <dt class="font-bold"><I18n.text values={@labels} /></dt>
    <%= for value <- @values do %>
      <dd class="ml-4"><%= value %></dd>
    <% end %>
    """
  end

  def render(%{type: "boolean"} = assigns) do
    ~H"""
    <dt class="font-bold"><I18n.text values={@labels} /></dt>
    <dd class="ml-4">
      <%= if @values,
        do: Gettext.gettext(FieldPublicationWeb.Gettext, "Yes"),
        else: Gettext.gettext(FieldPublicationWeb.Gettext, "No") %>
    </dd>
    """
  end

  def render(assigns) do
    Logger.warning("Unhandled field type: #{inspect(assigns)}")

    ~H"""

    """
  end
end
