defmodule FieldPublicationWeb.Presentation.Components.I18n do
  use Phoenix.Component

  def text(assigns) do
    ~H"""
    <% {status, text} = select_translation(assigns) %>
    <%= text %>
    <%= if status == :fallback do %>
      <span class="group">
        <sup>
          <span class="bg-yellow-100 pl-0.5 pr-0.5 text-xs rounded hidden group-hover:inline">
            No translation for your current selection
          </span>
          <span class="hero-information-circle h-4 w-4 group-hover:hidden"></span>
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
      <%= text
      |> Earmark.as_html!()
      |> Phoenix.HTML.raw() %>
    </span>
    """
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
