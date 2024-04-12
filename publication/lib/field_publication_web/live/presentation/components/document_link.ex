defmodule FieldPublicationWeb.Presentation.Components.DocumentLink do
  use Phoenix.Component

  def show(assigns) do
    ~H"""
    <.link
      class="text-[0.8125rem] leading-6 font-semibold"
      patch={"/#{@project}/#{@date}/#{@lang}/#{if @preview_doc["id"] != "project" do @preview_doc["id"] else "" end}"}
    >
      <%= @preview_doc["identifier"] %>
    </.link>
    """
  end
end
