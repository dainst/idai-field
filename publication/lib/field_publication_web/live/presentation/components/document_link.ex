defmodule FieldPublicationWeb.Presentation.Components.DocumentLink do
  use Phoenix.Component
  use FieldPublicationWeb, :verified_routes

  alias FieldPublication.Publications.Data

  alias FieldPublicationWeb.Presentation.Components.{
    Image,
    I18n
  }

  attr :doc, :map, required: true
  attr :project, :string, required: true
  attr :date, :string, required: true
  attr :lang, :string, required: true
  attr :image_count, :integer, default: 0

  def show(assigns) do
    ~H"""
    <div class="flex mb-[2px]">
      <div
        class="rounded-tl pl-2 rounded-bl"
        style={"background-color: #{@doc["category"]["color"]}; filter: saturate(50%); border-color: #{@doc["category"]["color"]}; border-width: 1px 0px 1px 0px;"}
      >
        <div class="h-full bg-white/60 pl-2 pr-2 pt-3 pb-3 font-thin">
          <I18n.text values={@doc["category"]["labels"]} />
        </div>
      </div>
      <.link
        class="grow p-3 rounded-tr rounded-br"
        style={"border-color: #{@doc["category"]["color"]}; filter:saturate(50%); border-width: 1px 1px 1px 0px;"}
        patch={
          ~p"/projects/#{@project}/#{@date}/#{@lang}/#{if @doc["id"] != "project" do
            @doc["id"]
          else
            ""
          end}"
        }
      >
        <div>
          <%= @doc["identifier"] %>
          <% shortdescription = Data.get_field(@doc, "shortDescription") %>
          <%= if shortdescription do %>
            <small class="ml-2 text-slate-600">
              <I18n.text values={shortdescription["values"]} />
            </small>
          <% end %>
        </div>
        <% images = Enum.take(Map.get(@doc, "images", []), @image_count) %>
        <div
          :if={images != []}
          class={"grid grid-cols-#{@image_count} gap-2 mt-2 justify-items-center"}
        >
          <%= for uuid <- images do %>
            <Image.show
              class="border-2 p-2 border-slate-100"
              size=",128"
              project={@project}
              uuid={uuid}
            />
          <% end %>
        </div>
      </.link>
    </div>
    """
  end

  def hierarchy(assigns) do
    ~H"""
    <div class="flex mb-[2px]">
      <div
        class="rounded-tl pl-2 rounded-bl"
        style={"background-color: #{@doc["category"]["color"]}; filter: saturate(50%); border-color: #{@doc["category"]["color"]}; border-width: 1px 0px 1px 0px;"}
      >
        <div class="h-full bg-white/60 pl-2 pr-2 pt-3 font-thin">
          <I18n.text values={@doc["category"]["labels"]} />
        </div>
      </div>
      <.link
        class={"grow p-3 rounded-tr rounded-br #{if Map.get(assigns, :is_highlighted), do: "bg-slate-200"}"}
        style={"border-color: #{@doc["category"]["color"]}; filter:saturate(50%); border-width: 1px 1px 1px 0px;"}
        patch={
          ~p"/projects/#{@project}/#{@date}/#{@lang}/hierarchy/#{if @doc["id"] != "project" do
            @doc["id"]
          else
            ""
          end}"
        }
      >
        <div>
          <%= @doc["identifier"] %>
          <% shortdescription = Data.get_field(@doc, "shortDescription") %>
          <%= if shortdescription do %>
            <small class="ml-2 text-slate-600">
              <I18n.text values={shortdescription["values"]} />
            </small>
          <% end %>
        </div>
      </.link>

      <div class="w-8 pt-3">
        <%= if Map.get(assigns, :is_highlighted) do %>
          <div class="hero-chevron-right"></div>
        <% end %>
      </div>
    </div>
    """
  end
end
