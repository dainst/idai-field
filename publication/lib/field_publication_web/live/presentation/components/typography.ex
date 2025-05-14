defmodule FieldPublicationWeb.Presentation.Components.Typography do
  use Phoenix.Component

  def document_heading(assigns) do
    ~H"""
    <h1 class="text-3xl mt-4 mb-4">
      {render_slot(@inner_block)}
    </h1>
    """
  end

  def group_heading(assigns) do
    ~H"""
    <h2 class="text-2xl mt-3">
      {render_slot(@inner_block)}
    </h2>
    """
  end
end
