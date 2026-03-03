defmodule FieldPublicationWeb.Presentation.Components.I18n do
  use Phoenix.Component

  def tabbed_text(%{values: values} = assigns) when is_binary(values) do
    ~H"""
    {@values}
    """
  end

  def tabbed_text(%{values: values} = assigns) when is_map(values) do
    ~H"""
    <div>
      <div class="flex relative">
        <%= for {key, value} <- @values do %>
          <details
            class="m-1 p-1 open:bg-gray-300"
            name={"i18n_tab_#{@field_name}"}
            open={Gettext.get_locale(FieldPublicationWeb.Gettext) |> IO.inspect() == key}
          >
            <summary class="text-xs cursor-pointer text-primary-hover">{key}</summary>
            <p class="absolute left-0 bg-gray-300">
              {value}
            </p>
          </details>
        <% end %>
      </div>
    </div>
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
