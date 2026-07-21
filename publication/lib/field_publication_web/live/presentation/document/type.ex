defmodule FieldPublicationWeb.Presentation.Document.Type do
  use FieldPublicationWeb, :live_component

  def render(assigns) do
    ~H"""
    <div>
      todo
    </div>
    """
  end

  def update(_assigns, socket) do
    {:ok, socket}
  end
end
