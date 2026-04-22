defmodule FieldPublicationWeb.Components.Data.DocumentLink do
  use FieldPublicationWeb, :html
  use FieldPublicationWeb, :verified_routes

  alias FieldPublication.Publications.Data.Document

  import FieldPublicationWeb.Components.Data.Image

  attr :id, :string, default: nil
  attr :doc, Document, required: true
  attr :image_count, :integer, default: 0
  attr :image_height, :integer, default: 64
  attr :geometry_indicator, :boolean, default: false
  attr :focus, :atom, default: :default

  def document_link(assigns) do
    ~H"""
    <div class="flex mb-0.5" id={if @id, do: @id, else: "#{@doc.id}_link"}>
      <.link
        navigate={~p"/search?#{%{filters: %{"category" => @doc.category.name}}}"}
        class="rounded-tl pl-2 rounded-bl suppress-link-styling"
        style={"background-color: #{desaturate_category_color(@doc.category.color)}; border-color: #{desaturate_category_color(@doc.category.color)}; border-width: 1px 1px 1px 0px;"}
      >
        <div class="h-full bg-white/70 hover:bg-white/40  pl-2 pr-2 pt-3 pb-3 font-thin hover:text-black text-gray-800">
          {pick_default_translation(@doc.category)}
        </div>
      </.link>
      <.link
        class="grow p-3 rounded-tr rounded-br hover:bg-(--primary-color)/10 suppress-link-styling"
        style={"border-color: #{desaturate_category_color(@doc.category.color)}; border-width: 1px 1px 1px 0px;"}
        navigate={construct_doc_link(@doc.project_key, @doc.publication_draft_date, @doc.id, @focus)}
      >
        <div>
          <span class="text-slate-600">{@doc.identifier}</span>
          <small class="ml-2 text-slate-600">
            <%= if @doc.description != %{} do %>
              {pick_default_translation(@doc.description)}
            <% end %>
            <.icon
              :if={@geometry_indicator and @doc.geometry != nil}
              name="hero-map"
              class="mb-1"
            />
          </small>
          <% uuids = Enum.take(@doc.image_uuids, @image_count) %>
          <div id={"#{@doc.id}-images"} class="flex items-center overflow-x-auto">
            <%= for uuid <- uuids do %>
              <.img_element
                size={"^,#{@image_height}"}
                class="p-1 inline"
                project={@doc.project_key}
                uuid={uuid}
                alt={"An image depicting '#{@doc.identifier}'"}
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

  defp construct_doc_link(project_name, draft_date, uuid, focus_parameter) do
    uuid = if uuid == "project", do: "", else: uuid

    query =
      case focus_parameter do
        :map ->
          %{focus: "map"}

        _ ->
          %{}
      end

    ~p"/projects/#{project_name}/#{draft_date}/#{uuid}?#{query}"
  end

  def desaturate_category_color(color) do
    "hsl(from  #{color} h calc(s * 0.5) l)"
  end
end
