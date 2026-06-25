defmodule FieldPublicationWeb.Markdown do
  @moduledoc """
  Markdown rendering helpers for user-controlled publication content.
  """

  def to_html(nil), do: Phoenix.HTML.raw("")

  def to_html(text) when is_binary(text) do
    text
    |> Earmark.as_html!(escape: true)
    |> Phoenix.HTML.raw()
  end
end
