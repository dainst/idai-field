defmodule FieldPublicationWeb.Presentation.Components.GenericField do
  use Phoenix.Component
  use FieldPublicationWeb, :verified_routes
  use FieldPublicationWeb, :html

  require Logger
  alias FieldPublication.Publications.Data.Field
  alias FieldPublicationWeb.Presentation.Components.I18n
  alias FieldPublication.Publications.Search

  defp is_search_keyword?(input_type) do
    input_type in (Search.get_keyword_inputs() ++ Search.get_keyword_multi_inputs())
  end

  attr :field, Field, required: true
  attr :lang, :string, default: Gettext.get_locale(FieldPublicationWeb.Gettext)

  def render(%{field: %Field{input_type: input_type}} = assigns)
      when input_type in ["input", "simpleInput", "text", "unsignedInt", "unsignedFloat", "date"] do
    ~H"""
    <.construct_search_link field={@field} value={@field.value}>
      <I18n.text values={@field.value} lang={@lang} />
    </.construct_search_link>
    """
  end

  def render(%{field: %Field{input_type: input_type}} = assigns)
      when input_type in ["checkboxes"] do
    ~H"""
    <%= for value <- @field.value do %>
      <div>
        <.construct_search_link field={@field} value={value}>
          <I18n.text values={value} lang={@lang} />
        </.construct_search_link>
      </div>
    <% end %>
    """
  end

  def render(%{field: %Field{input_type: input_type}} = assigns)
      when input_type in ["dropdown", "radio"] do
    ~H"""
    <.construct_search_link field={@field} value={@field.value}>
      <I18n.text values={Map.get(@field.value_labels, @field.value, @field.value)} />
    </.construct_search_link>
    """
  end

  def render(%{field: %Field{input_type: input_type}} = assigns)
      when input_type in ["dropdownRange"] do
    ~H"""
    <.construct_search_link field={@field} value={@field.value["value"]}>
      <I18n.text values={Map.get(@field.value_labels, @field.value["value"], @field.value["value"])} />
    </.construct_search_link>
    <%= if @field.value["endValue"] do %>
      -
      <.construct_search_link field={@field} value={@field.value["endValue"]}>
        <I18n.text
          values={Map.get(@field.value_labels, @field.value["endValue"], @field.value["endValue"])}
          lang={@lang}
        />
      </.construct_search_link>
    <% end %>
    """
  end

  def render(%{field: %Field{input_type: input_type}} = assigns)
      when input_type in ["boolean"] do
    ~H"""
    {if @field.value == true, do: gettext("true"), else: gettext("false")}
    """
  end

  def render(%{field: %Field{input_type: input_type}} = assigns)
      when input_type in ["literature"] do
    ~H"""
    <%= if is_list(@field.value) do %>
      <ul>
        <%= for value <- @field.value do %>
          <%= cond do %>
            <% Map.has_key?(value, "doi") -> %>
              <li>
                <a href={value["doi"]} target="_blank">{value["quotation"]}</a>
              </li>
            <% Map.has_key?(value, "zenonId") -> %>
              <li>
                <a href={value["zenonId"]} target="_blank">{value["quotation"]}</a>
              </li>
            <% Map.has_key?(value, "quotation") -> %>
              <li>
                {value["quotation"]}
              </li>
            <% true -> %>
              <li>
                <.render_warning value={value} />
              </li>
          <% end %>
        <% end %>
      </ul>
    <% else %>
      <.render_warning {assigns} />
    <% end %>
    """
  end

  def render(%{field: %Field{input_type: input_type}} = assigns)
      when input_type in ["dimension"] do
    ~H"""
    <%= for %{"inputUnit" => unit, "inputValue" => value, "isImprecise" => imprecise?, "measurementPosition" => position} <- @field.value do %>
      <div>
        {if position != nil and position != "", do: "#{position}: "}{"#{value} #{unit}"}{if imprecise?,
          do: " (#{gettext("imprecise")})"}
      </div>
    <% end %>
    """
  end

  def render(assigns) do
    render_warning(assigns)
  end

  attr :field, Field, required: true
  attr :value, :any, required: true
  slot :inner_block

  defp construct_search_link(assigns) do
    ~H"""
    <%= cond do %>
      <% is_search_keyword?(@field.input_type) -> %>
        <.link navigate={~p"/search?#{%{filters: %{"#{@field.name}_keyword" => @value}}}"}>
          {render_slot(@inner_block)}
        </.link>
        <!-- TODO: Add further variants? -->
      <% true -> %>
        {render_slot(@inner_block)}
    <% end %>
    """
  end

  defp render_warning(%{field: _field} = assigns) do
    Logger.warning("Unhandled field type: #{inspect(assigns)}")

    ~H"""
    <div class="border-yellow-400 border-4 m-2 p-2">
      Unhandled input type {inspect(@field)}
    </div>
    """
  end

  defp render_warning(%{value: _value} = assigns) do
    Logger.warning("Unhandled field value: #{inspect(assigns)}")

    ~H"""
    <div class="border-yellow-400 border-4 m-2 p-2">
      Unhandled input value {inspect(@value)}
    </div>
    """
  end
end
