defmodule FieldPublicationWeb.Components.Data.Field do
  use FieldPublicationWeb, :verified_routes
  use FieldPublicationWeb, :html

  require Logger
  alias FieldPublication.Publications.Data.Field
  alias FieldPublication.Publications.Search
  alias FieldPublicationWeb.Components.LanguageSelection

  defp is_search_keyword?(input_type) do
    input_type in (Search.get_keyword_inputs() ++ Search.get_keyword_multi_inputs())
  end

  attr :field, Field, required: true
  attr :hide_language_selection?, :boolean, default: false

  def render_field_data(%{field: %Field{input_type: input_type}} = assigns)
      when input_type in ["boolean"] do
    # Explictly calling gettext("true") and gettext("false") to enable the Gettext to pickup the value
    # just doing {gettext("#{@field.value})} would make it impossible for Gettext
    # to extract the key.
    ~H"""
    {if @field.value == true, do: gettext("true"), else: gettext("false")}
    """
  end

  def render_field_data(%{field: %Field{input_type: input_type}} = assigns)
      when input_type in ["input", "simpleInput", "text"] do
    ~H"""
    <.maybe_language_select
      :let={text}
      hide_selection?={@hide_language_selection?}
      field={@field}
      value={@field.value}
      id={@field.name}
    >
      <.maybe_search_link field={@field}>
        {text}
      </.maybe_search_link>
    </.maybe_language_select>
    """
  end

  def render_field_data(
        %{field: %Field{input_type: input_type, value_labels: value_labels}} = assigns
      )
      when input_type in ["dropdown", "radio"] and is_map(value_labels) do
    ~H"""
    <.maybe_language_select
      :let={text}
      hide_selection?={@hide_language_selection?}
      field={@field}
      value={@field.value}
      id={@field.name}
    >
      <.maybe_search_link field={@field}>
        {text}
      </.maybe_search_link>
    </.maybe_language_select>
    """
  end

  def render_field_data(%{field: %Field{input_type: input_type}} = assigns)
      when input_type == "checkboxes" do
    # Checkboxes where the selected value is mapped to a label.
    ~H"""
    <%= for value <- @field.value do %>
      <.maybe_language_select
        :let={text}
        field={@field}
        hide_selection?={@hide_language_selection?}
        value={value}
        id={"#{@field.name}_#{value}"}
      >
        <.maybe_search_link field={@field} value={value}>
          {text}
        </.maybe_search_link>
      </.maybe_language_select>
    <% end %>
    """
  end

  def render_field_data(
        %{field: %Field{input_type: input_type, value_labels: value_labels}} = assigns
      )
      when input_type in ["dropdownRange"] and is_map(value_labels) do
    ~H"""
    <% start_value = @field.value["value"] %>
    <% end_value = @field.value["endValue"] %>

    <.maybe_language_select
      :let={text}
      field={@field}
      hide_selection?={@hide_language_selection?}
      value={start_value}
      id={"#{@field.name}_#{start_value}"}
    >
      <.maybe_search_link field={@field} value={start_value}>
        {text}
      </.maybe_search_link>
    </.maybe_language_select>

    <%= if end_value do %>
      -
      <.maybe_language_select
        :let={text}
        field={@field}
        hide_selection?={@hide_language_selection?}
        value={end_value}
        id={
          "#{@field.name}_#{end_value}" |> Base.encode16() |> String.replace_prefix("", "language_")
        }
      >
        <.maybe_search_link field={@field} value={end_value}>
          {text}
        </.maybe_search_link>
      </.maybe_language_select>
    <% end %>
    """
  end

  def render_field_data(%{field: %Field{input_type: input_type}} = assigns)
      when input_type in ["unsignedInt", "unsignedFloat"] do
    ~H"""
    {@field.value}
    """
  end

  def render_field_data(%{field: %Field{input_type: input_type, value: value}} = assigns)
      when input_type == "date" and is_binary(value) do
    ~H"""
    {@field.value}
    """
  end

  def render_field_data(
        %{field: %Field{input_type: input_type, value: %{"isRange" => false} = value}} = assigns
      )
      when input_type == "date" and is_map(value) do
    ~H"""
    {@field.value["value"]}
    """
  end

  def render_field_data(%{field: %Field{input_type: input_type}} = assigns)
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

  def render_field_data(%{field: %Field{input_type: input_type}} = assigns)
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

  def render_field_data(assigns) do
    render_warning(assigns)
  end

  attr :field, Field, required: true
  attr :hide_language_selection?, :boolean, default: false

  def render_field_data_as_markdown(%{field: %Field{input_type: input_type}} = assigns)
      when input_type in ["input", "simpleInput", "text"] do
    ~H"""
    <.maybe_language_select
      :let={text}
      hide_selection?={@hide_language_selection?}
      field={@field}
      value={@field.value}
      id={@field.name}
    >
      <.maybe_search_link field={@field}>
        <span class="markdown">
          {text
          |> Earmark.as_html!()
          |> Phoenix.HTML.raw()}
        </span>
      </.maybe_search_link>
    </.maybe_language_select>
    """
  end

  attr :field, Field, required: true

  def render_field_label(%{field: %Field{labels: labels}} = assigns) when is_map(labels) do
    ~H"""
    <% language_keys = Map.keys(@field.labels) %>
    <% ui_lang = pick_default_language_key(language_keys) %>
    <% rendered_order = Enum.reject(language_keys, fn key -> key == ui_lang end) %>
    {@field.labels[ui_lang]}
    <!-- <div aria-describedby={description_id}>
      {@field.labels[ui_lang]}
    </div>
    <div id={description_id} role="tooltip" class="hidden">
      <%= for language_key <- rendered_order do %>
        <div class={"#{if language_key == ui_lang, do: "bg-primary/20"}"}>
          {Map.get(@field.labels, language_key)} <span class="text-xs" phx-hook="DisplayLanguage" id={"#{description_id}_#{language_key}"} lang={language_key}>{language_key}</span>
        </div>
      <% end %>
    </div> -->
    <!-- <div class="relative">



        <button
          class="cursor-pointer"
          phx-click={JS.show(to: "#field_#{@field.name}_label_translations")}
        >
            {@field.labels[ui_lang]}

            <div class="absolute bg-white left-8 z-55 hidden" id={"field_#{@field.name}_label_translations"}
              phx-click={JS.hide(to: "#field_#{@field.name}_label_translations")}>
    <%= for language_key <- rendered_order do %>
      <div class={"#{if language_key == ui_lang, do: "bg-primary/20"}"}>
      {Map.get(@field.labels, language_key)} <span class="text-xs" phx-hook="DisplayLanguage" id={"field_#{@field.name}_label_translations_#{language_key}"} lang={language_key}>{language_key}</span>
      </div>
    <% end %>
    </div>
    </button>

    </div>-->
    """
  end

  def render_field_label(assigns) do
    ~H"""
    <.render_warning {assigns} />
    """
  end

  attr :id, :string, required: true
  attr :field, Field, required: true
  attr :hide_selection?, :boolean, default: false
  attr :value, :any, required: true
  slot :inner_block, required: true

  defp maybe_language_select(
         %{
           field: %Field{value_labels: value_labels},
           value: value
         } = assigns
       )
       when is_binary(value) and (value_labels == %{} or is_nil(value_labels)) do
    # The field's "value" is just a single binary value.
    # There are also no translated labels for the value.

    ~H"""
    <div>
      {render_slot(@inner_block, @value)}
    </div>
    """
  end

  defp maybe_language_select(%{value: value} = assigns) when is_map(value) do
    ~H"""
    <%= case Map.keys(@value) do %>
      <% [one_language_key] -> %>
        {# If there is only one key, just show that single value.
        render_slot(@inner_block, @value[one_language_key])}
      <% _multiple_language_keys -> %>
        <.live_component
          :let={text}
          module={LanguageSelection}
          id={ensure_valid_id(@id)}
          translations={@value}
          hide_selection?={@hide_selection?}
        >
          {render_slot(@inner_block, text)}
        </.live_component>
    <% end %>
    """
  end

  defp maybe_language_select(%{value: value, field: %Field{value_labels: value_labels}} = assigns)
       when is_binary(value) and is_map(value_labels) do
    # The field's "value" is just a single binary value.
    # There are also translated labels for the value.

    ~H"""
    <% value_translations = @field.value_labels[@value] %>

    <%= if value_translations do %>
      <.live_component
        :let={text}
        module={LanguageSelection}
        id={ensure_valid_id(@id)}
        translations={value_translations}
        hide_selection?={@hide_selection?}
      >
        {render_slot(@inner_block, text)}
      </.live_component>
    <% else %>
      {# there was a map of translations, but this specific value was not
      # translated so we fallback to just rendering the value
      render_slot(@inner_block, @value)}
    <% end %>
    """
  end

  defp maybe_language_select(assigns) do
    ~H"""
    <.render_warning {assigns} />
    """
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

  defp render_warning(assigns) do
    Logger.warning("Unhandled field data: #{inspect(assigns)}")

    ~H"""
    <div class="border-yellow-400 border-4 m-2 p-2">
      Unhandled input type {inspect(@field)}
    </div>
    """
  end

  @regex ~r/[^\d\w_:.]/
  def ensure_valid_id(input) when is_binary(input), do: String.replace(input, @regex, "_")
end
