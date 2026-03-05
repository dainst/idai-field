defmodule FieldPublicationWeb.Components.Data.Field do
  use Phoenix.Component
  use FieldPublicationWeb, :verified_routes
  use FieldPublicationWeb, :html

  require Logger
  alias FieldPublication.Publications.Data.Field
  alias FieldPublicationWeb.Presentation.Components.I18n
  alias FieldPublication.Publications.Search

  import I18n

  defp is_search_keyword?(input_type) do
    input_type in (Search.get_keyword_inputs() ++ Search.get_keyword_multi_inputs())
  end

  attr :field, Field, required: true
  attr :lang, :string, default: Gettext.get_locale(FieldPublicationWeb.Gettext)

  def render_data_field(%{field: %Field{input_type: input_type}} = assigns)
      when input_type in ["boolean"] do
    # Explictly calling gettext("true") and gettext("false") to enable the Gettext to pickup the value
    # just doing {gettext("#{@field.value})} would make it impossible for Gettext
    # to extract the key.
    ~H"""
    {if @field.value == true, do: gettext("true"), else: gettext("false")}
    """
  end

  def render_data_field(%{field: %Field{input_type: input_type}} = assigns)
      when input_type in ["input", "simpleInput", "text"] do
    ~H"""
    <.tabbed_text :let={text} values={@field.value} field_name={@field.name}>
      {text}
    </.tabbed_text>
    """
  end

  def render_data_field(
        %{field: %Field{input_type: input_type, value_labels: value_labels}} = assigns
      )
      when input_type in ["dropdown", "radio"] and is_map(value_labels) do
    ~H"""
    <.tabbed_text
      :let={text}
      values={@field.value_labels[@field.value] || @field.value}
      field_name={@field.name}
    >
      <.maybe_search_link field={@field}>
        {text}
      </.maybe_search_link>
    </.tabbed_text>
    """
  end

  def render_data_field(
        %{field: %Field{input_type: input_type, value_labels: value_labels}} = assigns
      )
      when input_type == "checkboxes" and (is_nil(value_labels) or value_labels == %{}) do
    # Checkboxes where the selected value is also what should be displayed (because there are no labels).
    ~H"""
    <%= for value <- @field.value do %>
      <div>
        <.tabbed_text :let={text} values={value} field_name={@field.name}>
          <.maybe_search_link field={@field} value={value}>
            {text}
          </.maybe_search_link>
        </.tabbed_text>
      </div>
    <% end %>
    """
  end

  def render_data_field(
        %{field: %Field{input_type: input_type, value_labels: value_labels}} = assigns
      )
      when input_type == "checkboxes" and is_map(value_labels) do
    # Checkboxes where the selected value is mapped to a label.
    ~H"""
    <%= for value <- @field.value do %>
      <.tabbed_text
        :let={text}
        values={@field.value_labels[value] || value}
        field_name={"#{@field.name}_#{value}"}
      >
        <.maybe_search_link field={@field} value={value}>
          {text}
        </.maybe_search_link>
      </.tabbed_text>
    <% end %>
    """
  end

  def render_data_field(
        %{field: %Field{input_type: input_type, value_labels: value_labels}} = assigns
      )
      when input_type in ["dropdownRange"] and is_map(value_labels) do
    ~H"""
    <% start_value = @field.value["value"] %>
    <% end_value = @field.value["endValue"] %>
    <.tabbed_text
      :let={text}
      values={@field.value_labels[start_value] || start_value}
      field_name={"#{@field.name}_#{start_value}"}
    >
      <.maybe_search_link field={@field} value={start_value}>
        {text}
      </.maybe_search_link>
    </.tabbed_text>

    <%= if end_value do %>
      -
      <.tabbed_text
        :let={text}
        values={@field.value_labels[end_value] || end_value}
        field_name={"#{@field.name}_#{end_value}"}
      >
        <.maybe_search_link field={@field} value={end_value}>
          {text}
        </.maybe_search_link>
      </.tabbed_text>
    <% end %>
    """
  end

  def render_data_field(%{field: %Field{input_type: input_type}} = assigns)
      when input_type in ["unsignedInt", "unsignedFloat"] do
    ~H"""
    {@field.value}
    """
  end

  def render_data_field(%{field: %Field{input_type: input_type, value: value}} = assigns)
      when input_type == "date" and is_binary(value) do
    ~H"""
    {@field.value}
    """
  end

  def render_data_field(
        %{field: %Field{input_type: input_type, value: %{"isRange" => false} = value}} = assigns
      )
      when input_type == "date" and is_map(value) do
    ~H"""
    {@field.value["value"]}
    """
  end

  def render_data_field(%{field: %Field{input_type: input_type}} = assigns)
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

  def render_data_field(%{field: %Field{input_type: input_type}} = assigns)
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

  def render_data_field(assigns) do
    render_warning(assigns)
  end

  attr :field, Field, required: true

  attr :value, :string,
    default: nil,
    doc:
      "Explicitly define which value to use, for example if the field's `value` key is a list of selected values."

  slot :inner_block, required: true

  defp maybe_search_link(assigns) do
    ~H"""
    <% value = if @value, do: @value, else: @field.value %>
    <%= cond do %>
      <% is_search_keyword?(@field.input_type) -> %>
        <.link navigate={~p"/search?#{%{filters: %{"#{@field.name}_keyword" => value}}}"}>
          {render_slot(@inner_block)}
        </.link>
        <!-- TODO: Add further variants that are not keywords? -->
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
