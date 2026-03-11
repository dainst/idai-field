defmodule FieldPublicationWeb.Components.LanguageDefault do
  use FieldPublicationWeb, :html

  alias FieldPublicationWeb.Components.LanguageSelection

  def pick_language(assigns) do
    ~H"""
    {@values[LanguageSelection.pick_default_translation(Map.keys(@values))]}
    """
  end
end
