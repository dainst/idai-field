defmodule FieldPublicationWeb.Components.Data.DocumentLink do
  use FieldPublicationWeb, :html

  alias FieldPublication.Publications.Data.Document

  import FieldPublicationWeb.Components.Data.Image

  attr(:id, :string, default: nil)
  attr(:doc, Document, required: true)
  attr(:image_count, :integer, default: 0)
  attr(:image_height, :integer, default: 64)
  attr(:geometry_indicator, :boolean, default: false)
  attr(:live_action, :atom, default: nil)
  attr(:hover_target, :string, default: nil)
  attr(:publication_search?, :boolean, default: true)

  def document_link(assigns) do
    ~H"""
    <% id = if @id, do: @id, else: "#{@doc.id}_link" %>
    <.maybe_map_hover_event id={"#{id}_map_hover"} doc={@doc} target_id={@hover_target}>
      <div class="bg-white flex rounded mb-0.5" id={id}>
        <.link
          navigate={
            if @publication_search? do
              ~p"/projects/search/#{@doc.project_key}/#{@doc.publication_draft_date}?#{%{filters: %{"category" => @doc.category.name}}}"
            else
              ~p"/search?#{%{filters: %{"category" => @doc.category.name}}}"
            end
          }
          class="rounded-tl pl-2 rounded-bl suppress-link-styling"
          style={"background-color: #{desaturate_category_color(@doc.category.color)}; border-color: #{desaturate_category_color(@doc.category.color)}; border-width: 1px 1px 1px 0px;"}
        >
          <div class="h-full bg-white/70 hover:bg-white/40  pl-2 pr-2 pt-3 pb-3 font-thin hover:text-black text-gray-800">
            {pick_default_translation(@doc.category.labels)}
          </div>
        </.link>
        <.link
          class="grow p-3 rounded-tr rounded-br hover:bg-(--primary-color)/10 suppress-link-styling"
          style={"border-color: #{desaturate_category_color(@doc.category.color)}; border-width: 1px 1px 1px 0px;"}
          navigate={
            construct_doc_link(@doc.project_key, @doc.publication_draft_date, @doc.id, @live_action)
          }
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
            <div id={"#{id}-images"} class="flex items-center overflow-x-auto">
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
    </.maybe_map_hover_event>
    """
  end

  def desaturate_category_color(color) do
    "hsl(from  #{color} h calc(s * 0.5) l)"
  end

  defp construct_doc_link(project_name, draft_date, uuid, live_action) do
    uuid = if uuid == "project", do: "", else: uuid
    construct(project_name, draft_date, uuid, live_action)
  end

  defp construct(project_name, draft_date, uuid, nil) do
    ~p"/projects/#{project_name}/#{draft_date}/#{uuid}"
  end

  defp construct(project_name, draft_date, uuid, :map_dataseeet) do
    ~p"/projects/#{project_name}/#{draft_date}/#{uuid}/map"
  end

  defp construct(project_name, draft_date, uuid, :map_hierarchy) do
    ~p"/projects/#{project_name}/#{draft_date}/#{uuid}/map/hierarchy"
  end

  defp construct(project_name, draft_date, uuid, :map_context) do
    ~p"/projects/#{project_name}/#{draft_date}/#{uuid}/map/context"
  end

  attr(:id, :string, required: true)
  attr(:doc, Document, required: true)
  attr(:target_id, :string, default: nil)
  slot(:inner_block, required: true)

  defp maybe_map_hover_event(assigns) do
    ~H"""
    <%= if @doc.geometry && @target_id do %>
      <div
        id={"hover_hook_#{@id}"}
        phx-hook="HoverHighlightMapFeature"
        target_dom_element={@target_id}
        target_id={@doc.id}
      >
        {render_slot(@inner_block)}
      </div>
    <% else %>
      <div>
        {render_slot(@inner_block)}
      </div>
    <% end %>
    """
  end
end
