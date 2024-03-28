defmodule FieldPublicationWeb.Presentation.Components.I18n do
  use Phoenix.Component

  def text(assigns) do
    ~H"""
    <span>
      <%= select_translation(assigns) %>
    </span>
    """
  end

  def markdown(assigns) do
    ~H"""
    <span class="markdown">
      <%= select_translation(assigns)
      |> Earmark.as_html!()
      |> Phoenix.HTML.raw() %>
    </span>
    """
  end

  defp select_translation(%{values: translations} = assigns) do
    lang =
      if Map.has_key?(assigns, :lang) do
        assigns[:lang]
      else
        :unspecified
      end

    case translations do
      nil ->
        "No value"

      val when is_binary(val) ->
        val

      val when is_map(val) ->
        Map.get(val, lang, fallback(val))
    end
  end

  defp fallback(val) do
    # Try the current application language setting as a fallback.
    # Otherwise, we fallback to the first key found in the map.
    case Map.get(val, Gettext.get_locale(FieldPublicationWeb.Gettext)) do
      nil ->
        first_key =
          Map.keys(val)
          |> List.first()

        Map.get(val, first_key, "No value")

      application_lang_text ->
        application_lang_text
    end
  end
end
