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
      <.link
        navigate={~p"/search?#{%{filters: %{"category" => @doc.category.name}}}"}
        class="rounded-tl pl-2 rounded-bl text-black"
        style={"background-color: #{@doc.category.color}; filter: saturate(50%); border-color: #{@doc.category.color}; border-width: 1px 1px 1px 0px;"}
      >
        <div class="h-full bg-white/60 pl-2 pr-2 pt-3 pb-3 font-thin">
          <I18n.text values={@doc.category.labels} />
        </div>
      </.link>
      <.link
        class="grow p-3 rounded-tr rounded-br"
        style="border-width: 1px 1px 1px 0px;"
        patch={
          ~p"/projects/#{@project}/#{@date}/#{@lang}/#{if @doc.id != "project" do
            @doc.id
          else
            ""
          end}"
        }
      >
        <div>
          <span><%= @doc.identifier %></span>
          <% shortdescription = Data.get_field(@doc, "shortDescription") %>
          <%= if shortdescription do %>
            <small class="ml-2 text-slate-600">
              <I18n.text values={shortdescription.value} />
            </small>
          <% end %>
          <% uuids = Enum.take(@doc.image_uuids, @image_count) %>
          <div class="flex items-center overflow-x-auto">
            <%= for uuid <- uuids do %>
              <Image.show
                size="^,128"
                class="p-1 inline"
                project={@project}
                uuid={uuid}
                alt_text={"An image depicting '#{@doc.identifier}'"}
              />
            <% end %>
            <%= if uuids== [] and @image_count > 0 do %>
              <small class="text-black">no images</small>
            <% end %>
          </div>
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
        style={"background-color: #{@doc.category.color}; filter: saturate(50%); border-color: #{@doc.category.color}; border-width: 1px 0px 1px 0px;"}
      >
        <div class="h-full bg-white/60 pl-2 pr-2 pt-3 font-thin">
          <I18n.text values={@doc.category.labels} />
        </div>
      </div>
      <.link
        class={"grow p-3 rounded-tr rounded-br #{if Map.get(assigns, :is_highlighted), do: "bg-slate-200"}"}
        style={"border-color: #{@doc.category.color}; filter:saturate(50%); border-width: 1px 1px 1px 0px;"}
        patch={
          ~p"/projects/#{@project}/#{@date}/#{@lang}/hierarchy/#{if @doc.id != "project" do
            @doc.id
          else
            ""
          end}"
        }
      >
        <div>
          <%= @doc.identifier %>
          <% shortdescription = Data.get_field(@doc, "shortDescription") %>
          <%= if shortdescription do %>
            <small class="ml-2 text-slate-600">
              <I18n.text values={shortdescription.value} />
            </small>
          <% end %>
          <% preview_image_uuid = @doc.image_uuids |> List.first() %>
          <div :if={preview_image_uuid != nil}>
            <Image.show
              size="^,128"
              class="pt-1 border-slate-100"
              project={@project}
              uuid={preview_image_uuid}
              alt_text={"An image depicting #{@doc.identifier}"}
            />
          </div>
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
