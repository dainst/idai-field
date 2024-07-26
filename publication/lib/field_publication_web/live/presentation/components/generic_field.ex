defmodule FieldPublicationWeb.Presentation.Components.GenericField do
  use Phoenix.Component
  use FieldPublicationWeb, :verified_routes

  require Logger
  alias FieldPublication.Publications.Data.Field
  alias FieldPublicationWeb.Presentation.Components.I18n
  alias FieldPublication.Publications.Search

  defp is_search_keyword?(input_type) do
    input_type in (Search.get_keyword_inputs() ++ Search.get_keyword_multi_inputs())
  end

  def render(%{field: %Field{value: value}} = assigns)
      when is_binary(value) or is_map(value) or is_number(value) or is_boolean(value) do
    ~H"""
    <dt class="font-bold"><I18n.text values={@field.labels} /></dt>

    <.render_value
      list_labels={@field.value_labels}
      key={@field.name}
      value={@field.value}
      type={@field.input_type}
    />
    """
  end

  def render(%{field: %Field{value: values}} = assigns) when is_list(values) do
    ~H"""
    <dt class="font-bold"><I18n.text values={@field.labels} /></dt>

    <%= for value <- @field.value do %>
      <.render_value
        list_labels={@field.value_labels}
        key={@field.name}
        value={value}
        type={@field.input_type}
      />
    <% end %>
    """
  end

  def render(assigns) do
    Logger.warning("Unhandled field type: #{inspect(assigns)}")

    ~H"""
    <div class="border-yellow-400 border-4 m-2 p-2">
      Unhandled input type <%= inspect(@field) %>
    </div>
    """
  end

  defp render_value(assigns) do
    ~H"""
    <dd class="ml-4">
      <.render_link key={@key} value={@value} add={is_search_keyword?(@type)}>
        <%= if @list_labels  do %>
          <!-- if the value in the raw document is not part of the list of labels, fallback to the value itself
          this handles data quality issues, where data was imported into the field that does not match the
          referenced list -->
          <I18n.text values={get_in(@list_labels, [@value, "label"]) || @value} />
        <% else %>
          <I18n.text values={@value} />
        <% end %>
      </.render_link>
    </dd>
    """
  end

  defp render_link(%{add: true, value: value} = assigns) when is_map(value) do
    # TODO: This handles keyword fields that are based on value lists (dropdownRanges?), the actual value we want
    # to search is contained in @value["value"]. The naming/structure is suboptimal currently.

    ~H"""
    <.link navigate={~p"/search?#{%{filters: %{"#{@key}_keyword" => @value["value"]}}}"}>
      <%= render_slot(@inner_block) %>
    </.link>
    """
  end

  defp render_link(%{add: true} = assigns) do
    ~H"""
    <.link navigate={~p"/search?#{%{filters: %{"#{@key}_keyword" => @value}}}"}>
      <%= render_slot(@inner_block) %>
    </.link>
    """
  end

  defp render_link(%{add: false} = assigns) do
    ~H"""
    <%= render_slot(@inner_block) %>
    """
  end
end
