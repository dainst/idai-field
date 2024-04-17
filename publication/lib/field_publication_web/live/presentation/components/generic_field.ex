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

  def render(%{type: type, values: values} = assigns)
      when type in ["checkboxes", "simpleMultiInput"] and is_list(values) do
    ~H"""
    <dt class="font-bold"><I18n.text values={@labels} /></dt>
    <%= for value <- @values do %>
      <dd class="ml-4"><%= value %></dd>
    <% end %>
    """
  end

  def render(%{type: single_value} = assigns)
      when single_value in ["unsignedInt", "date", "radio", "checkboxes"] do
    ~H"""
    <dt class="font-bold"><I18n.text values={@labels} /></dt>
    <dd class="ml-4"><%= @values %></dd>
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

  def render(%{type: "dimension"} = assigns) do
    ~H"""
    <dt class="font-bold"><I18n.text values={@labels} /></dt>
    <%= for value <- @values do %>
      <dd class="ml-4 mb-1">
        <%= value["inputValue"] %> <%= value["inputUnit"] %>
        <%= if value["isImprecise"] do %>
          <small>(<%= Gettext.gettext(FieldPublicationWeb.Gettext, "imprecise") %>)</small>
        <% end %>
        <%= if Map.get(value, "measurementComment", "") != "" do %>
          <br />
          <%= value["measurementComment"] %>
        <% end %>

        <%= if Map.get(value, "measurementPosition", "") != "" do %>
          <br />
          <%= Gettext.gettext(FieldPublicationWeb.Gettext, "measurementPosition") %>: <%= value[
            "measurementPosition"
          ] %>
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
