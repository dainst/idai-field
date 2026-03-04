defmodule FieldPublicationWeb.Presentation.Components.I18n do
  use Phoenix.Component

  attr :field_name, :string, required: true
  attr :values, :any, required: true
  attr :height, :string, default: "h-14"
  slot :inner_block, required: true

  def tabbed_text(%{values: values} = assigns) when is_binary(values) do
    # Fallback if assigned `values` is just a binary string.
    ~H"""
    {render_slot(@inner_block, @values)}
    """
  end

  def tabbed_text(%{values: values} = assigns) when is_map(values) do
    ~H"""
    <% user_ui_language = Gettext.get_locale(FieldPublicationWeb.Gettext) %>

    <%= case Map.keys(@values) do %>
      <% [the_only_key] -> %>
        <!-- Use the fallback, not creating a tabbed selection (see above) -->
        <.tabbed_text
          :let={text}
          values={@values[the_only_key]}
          field_name={@field_name}
        >
          {text}
        </.tabbed_text>
      <% multiple_keys -> %>
        <% initial =
          cond do
            user_ui_language in multiple_keys ->
              user_ui_language

            "en" in multiple_keys ->
              "en"

            true ->
              List.first(multiple_keys)
          end %>

        <div class={"flex relative #{@height}"}>
          <%= for {lang, text} <- @values do %>
            <details
              class="m-1 p-1 rounded-t  open:bg-panel open:pointer-events-none overflow-x-auto"
              name={"i18n_tab_#{@field_name}"}
              open={
                # sets the initially selected value
                initial == lang
              }
            >
              <summary class="font-thin text-[12px] text-primary hover:text-primary-hover cursor-pointer">
                <span id={"i18n_tab_#{@field_name}_#{lang}"} phx-hook="DisplayLanguage" lang={lang}>
                  {lang}
                </span>
              </summary>
              <div class="absolute left-0 w-full text-nowrap p-1 overflow-x-auto bg-panel pointer-events-auto">
                {render_slot(@inner_block, text)}
              </div>
            </details>
          <% end %>
        </div>
    <% end %>
    """

    # ~H"""
    # <div class="i18n-tabs">
    #
    #     <div class="i18n-tab">
    #       <input type="radio" id={"#{key}_#{@field_name}"} name={"tab_#{@field_name}"} checked />
    #       <label for={"#{key}_#{@field_name}"}>{key}</label>
    #       <div class="i18n-tab-content">
    #         <p>{value}</p>
    #       </div>
    #     </div>
    #   <% end %>
    # </div>
    # """
  end

  def text(assigns) do
    ~H"""
    <% {status, text} = select_translation(assigns) %>
    {text}
    <%= if status == :fallback do %>
      <span class="group">
        <sup>
          <span class="hero-information-circle h-4 w-4"></span>
          <div class="absolute z-10 bg-yellow-100 pl-1 pr-1 text-xs rounded hidden group-hover:inline">
            No translation for your current selection
          </div>
        </sup>
      </span>
    <% end %>
    """
  end

  def markdown(assigns) do
    ~H"""
    <% {status, text} = select_translation(assigns) %>
    <%= if status == :fallback do %>
      <span class="bg-yellow-100 pl-0.5 pr-0.5 text-xs rounded">
        No translation for your current selection
      </span>
    <% end %>
    <span class="markdown">
      {text
      |> Earmark.as_html!()
      |> Phoenix.HTML.raw()}
    </span>
    """
  end

  def best_fit_language(translations) do
    selected_language = Gettext.get_locale(FieldPublicationWeb.Gettext)

    Map.get(translations, selected_language)
    |> case do
      nil ->
        Map.get(translations, "en")

      val ->
        val
    end
  end

  def select_translation(%{values: translations} = assigns) do
    lang =
      if Map.has_key?(assigns, :lang) do
        assigns[:lang]
      else
        :unspecified
      end

    case translations do
      nil ->
        {:not_translated, "No value"}

      val when is_map(val) ->
        Map.get(val, lang)
        |> case do
          nil ->
            fallback(val)

          text ->
            {:ok, text}
        end

      val ->
        {:not_translated, val}
    end
  end

  defp fallback(val) do
    # Try the current application language setting as a fallback.
    # Otherwise, we fallback to the first key found in the map.
    case Map.get(val, Gettext.get_locale(FieldPublicationWeb.Gettext)) do
      nil ->
        case Map.get(val, "en") do
          nil ->
            first_key =
              Map.keys(val)
              |> List.first()

            {:fallback, Map.get(val, first_key, "No value")}

          english ->
            {:fallback, english}
        end

      application_lang_text ->
        {:ui_lang, application_lang_text}
    end
  end
end
