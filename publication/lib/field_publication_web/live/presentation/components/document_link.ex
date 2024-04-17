defmodule FieldPublicationWeb.Presentation.Components.DocumentLink do
  use Phoenix.Component

  alias FieldPublicationWeb.Presentation.Components.{
    I18n
  }

  def show(assigns) do
    ~H"""
    <div class="flex">
      <div
        class="p-2 rounded-tl rounded-bl"
        style={"background-color: #{@preview_doc["category"]["color"]}; filter: saturate(50%);"}
      >
        <div class="h-full bg-slate-50 rounded p-1 font-thin">
          <I18n.text values={@preview_doc["category"]["labels"]} />
        </div>
      </div>
      <.link
        class="grow p-3 rounded-tr rounded-br"
        style={"border-color: #{@preview_doc["category"]["color"]}; filter:saturate(50%); border-width: 1px 1px 1px 0px"}
        patch={"/#{@project}/#{@date}/#{@lang}/#{if @preview_doc["id"] != "project" do @preview_doc["id"] else "" end}"}
      >
        <div>
          <%= @preview_doc["identifier"] %>
        </div>
      </.link>
    </div>
    """
  end
end
