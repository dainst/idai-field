defmodule FieldPublicationWeb.Presentation.Components.GenericField do
  use Phoenix.Component
  use FieldPublicationWeb, :verified_routes

  require Logger
  alias FieldPublicationWeb.Presentation.Components.I18n

  def render(%{type: type, values: values} = assigns)
      when type in ["checkboxes", "simpleMultiInput", "dropdown"] and is_list(values) do
    ~H"""
    <dt class="font-bold"><I18n.text values={@labels} /></dt>
    <%= for value <- @values do %>
      <dd class="ml-4">
        <%= if @type in FieldPublication.Publications.Search.get_keyword_multi_inputs() do %>
          <.link navigate={~p"/search?#{%{filters: %{"#{@key}_keyword" => value}}}"}>
            <I18n.text values={value} />
          </.link>
        <% else %>
          <I18n.text values={value} />
        <% end %>
      </dd>
    <% end %>
    """
  end

  def render(%{type: single_value} = assigns)
      when single_value in ["input", "text", "simpleInput", "dropdown", "dropdownRange"] do
    ~H"""
    <dt class="font-bold"><I18n.text values={@labels} /></dt>
    <dd class="ml-4">
      <%= if @type in FieldPublication.Publications.Search.get_keyword_inputs() do %>
        <.link navigate={~p"/search?#{%{filters: %{"#{@key}_keyword" => @values}}}"}>
          <I18n.text values={@values} />
        </.link>
      <% else %>
        <I18n.text values={@values} />
      <% end %>
    </dd>
    """
  end

  def render(%{type: single_value} = assigns)
      when single_value in ["unsignedInt", "unsignedFloat", "date", "radio", "checkboxes"] do
    ~H"""
    <dt class="font-bold"><I18n.text values={@labels} /></dt>
    <dd class="ml-4">
      <%= if @type in FieldPublication.Publications.Search.get_keyword_inputs() do %>
        <.link navigate={~p"/search?#{%{filters: %{"#{@key}_keyword" => @values}}}"}>
          <%= @values %>
        </.link>
      <% else %>
        <%= @values %>
      <% end %>
    </dd>
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
