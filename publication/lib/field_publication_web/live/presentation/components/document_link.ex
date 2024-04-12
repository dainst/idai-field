defmodule FieldPublicationWeb.Presentation.Components.DocumentLink do
  use Phoenix.Component

  def show(assigns) do
    ~H"""
    <.link
      class="text-[0.8125rem] leading-6 font-semibold"
      patch={"/#{@project}/#{@date}/#{@lang}/#{@preview_doc["id"]}"}
    >
      <%= @preview_doc["identifier"] %>
    </.link>
    """
  end
end
