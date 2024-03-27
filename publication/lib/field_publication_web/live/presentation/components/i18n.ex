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
    # English is the primary fallback, if it is not present
    # we fallback to the first key found in the map.
    case Map.get(val, "en") do
      nil ->
        first_key =
          Map.keys(val)
          |> List.first()

        Map.get(val, first_key, "No value")

      english ->
        english
    end
  end
end
