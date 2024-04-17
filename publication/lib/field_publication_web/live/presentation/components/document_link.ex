defmodule FieldPublicationWeb.Presentation.Components.DocumentLink do
  use Phoenix.Component

  alias FieldPublication.Publications.Data

  alias FieldPublicationWeb.Presentation.Components.{
    I18n
  }

  def show(assigns) do
    ~H"""
    <div class="flex mb-[2px]">
      <div
        class="rounded-tl pl-2 rounded-bl"
        style={"background-color: #{@preview_doc["category"]["color"]}; filter: saturate(50%); border-color: #{@preview_doc["category"]["color"]}; border-width: 1px 0px 1px 0px;"}
      >
        <div class="h-full bg-white/60 pl-2 pr-2 pt-3 font-thin">
          <I18n.text values={@preview_doc["category"]["labels"]} />
        </div>
      </div>
      <.link
        class="grow p-3 rounded-tr rounded-br"
        style={"border-color: #{@preview_doc["category"]["color"]}; filter:saturate(50%); border-width: 1px 1px 1px 0px;"}
        patch={"/#{@project}/#{@date}/#{@lang}/#{if @preview_doc["id"] != "project" do @preview_doc["id"] else "" end}"}
      >
        <div>
          <%= @preview_doc["identifier"] %>
          <% shortdescription = Data.get_field(@preview_doc, "shortDescription") %>
          <%= if shortdescription do %>
            <small class="ml-2 text-slate-600">
              <I18n.text values={shortdescription["values"]} />
            </small>
          <% end %>
        </div>
      </.link>
    </div>
    """
  end
end
