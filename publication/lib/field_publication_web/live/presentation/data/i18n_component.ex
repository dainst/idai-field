defmodule FieldPublicationWeb.Presentation.Data.I18n do
  use Phoenix.Component

  def text(assigns) do
    ~H"""
    <span>
      <%= select_translation(@values) %>
    </span>
    """
  end

  def markdown(assigns) do
    ~H"""
    <span class="markdown">
      <%= @values
      |> select_translation()
      |> Earmark.as_html!()
      |> Phoenix.HTML.raw() %>
    </span>
    """
  end

  defp select_translation(values) do
    case values do
      val when is_nil(val) ->
        "No value"

      val when is_binary(val) ->
        values

      val when is_map(val) ->
        # TODO: Add preference selection
        case Map.keys(val) do
          [single_key] ->
            values[single_key]

          [first, _] ->
            values[first]
        end
    end
  end
end
