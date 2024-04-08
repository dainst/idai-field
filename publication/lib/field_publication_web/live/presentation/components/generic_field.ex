defmodule FieldPublicationWeb.Presentation.Components.GenericField do
  use Phoenix.Component

  require Logger
  alias FieldPublicationWeb.Presentation.Components.I18n

  def render(%{type: single_value} = assigns)
      when single_value in ["input", "text", "simpleInput"] do
    ~H"""
    <dt class="font-bold"><I18n.text values={@labels} /></dt>
    <dd class="ml-4"><I18n.text values={@values} /></dd>
    """
  end

  def render(%{type: single_value} = assigns)
      when single_value in ["unsignedInt", "date", "radio"] do
    ~H"""
    <dt class="font-bold"><I18n.text values={@labels} /></dt>
    <dd class="ml-4"><%= @values %></dd>
    """
  end

  def render(%{type: type} = assigns) when type in ["checkboxes", "simpleMultiInput"] do
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

  def render(%{type: "literature", values: values} = assigns) when is_list(values) do
    ~H"""
    <dt class="font-bold"><I18n.text values={@labels} /></dt>
    <%= for value <- @values do %>
      <dd class="ml-4 mb-1">
        <%= case value do %>
          <% %{"doi" => url, "quotation" => quotation} -> %>
            <a class="text-[#5882c2] hover:text-[#375d97]" href={url}><%= quotation %></a>
          <% %{"zenonId" => url, "quotation" => quotation} -> %>
            <a class="text-[#5882c2] hover:text-[#375d97]" href={url}><%= quotation %></a>
          <% %{"quotation" => quotation} -> %>
            <%= quotation %>
        <% end %>
      </dd>
    <% end %>
    """
  end

  def render(assigns) do
    Logger.warning("Unhandled field type: #{inspect(assigns)}")

    ~H"""

    """
  end
end
