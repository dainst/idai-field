defmodule FieldPublicationWeb.UI.Components.Data.DocumentLink do
  use FieldPublicationWeb, :html

  alias FieldPublication.Publication.Document

  import FieldPublicationWeb.UI.Components.Data.Image

  attr(:docs, :list, required: true)
  attr(:image_count, :integer, default: 0)
  attr(:image_height, :integer, default: 64)
  attr(:geometry_indicator, :boolean, default: false)
  attr(:live_action, :atom, default: nil)
  attr(:hover_target, :string, default: nil)
  attr(:publication_search?, :boolean, default: true)

  def grouped_document_links(assigns) do
    ~H"""
    <%= for {_category, docs} <- Enum.group_by(
        @docs, fn %Document{} = doc ->
        doc.category.name
        end) do %>
      <section>
        <% first_id = List.first(docs) |> Map.get(:id) %>
        <% last_id = List.last(docs) |> Map.get(:id) %>
        <%= for {doc, index} <- Enum.with_index(docs) do %>
          <.document_link
            doc={doc}
            is_grouped?={true}
            image_count={@image_count}
            image_height={@image_height}
            geometry_indicator={@geometry_indicator}
            live_action={@live_action}
            hover_target={@hover_target}
            publication_search?={@publication_search?}
            is_first?={doc.id == first_id}
            is_last?={doc.id == last_id}
          />
        <% end %>
      </section>
    <% end %>
    """
  end

  @doc """
  Renders the link to a publication document
  """

  attr(:id, :string, default: nil)
  attr(:doc, Document, required: true)
  attr(:image_count, :integer, default: 0)
  attr(:image_height, :integer, default: 64)
  attr(:geometry_indicator, :boolean, default: false)
  attr(:live_action, :atom, default: nil)
  attr(:hover_target, :string, default: nil)
  attr(:publication_search?, :boolean, default: true)
  attr(:is_grouped?, :boolean, default: false)
  attr(:is_first?, :boolean, default: false)
  attr(:is_last?, :boolean, default: false)
  attr(:no_link?, :boolean, default: false)

  def document_link(assigns) do
    ~H"""
    <div class={"relative group #{if @is_grouped? && !@is_first?, do: "mt-0.5", else: "mt-4"}"}>
      <div
        class={"flex #{if @is_last? || !@is_grouped?, do: "rounded-bl"}"}
        style={"background-color: #{desaturate_category_color(@doc.category.color)};"}
      >
        <.link
          :if={!@no_link?}
          class="ml-3 bg-white/95 hover:bg-white/80 grow overflow-hidden text-ellipsis p-3 suppress-link-styling"
          navigate={
            construct_doc_link(
              @doc.project_identifier,
              @doc.publication_draft_date,
              @doc.id,
              @live_action
            )
          }
        >
          <.render_info
            id={@id}
            doc={@doc}
            geometry_indicator={@geometry_indicator}
            hover_target={@hover_target}
            image_height={@image_height}
            image_count={@image_count}
          />
        </.link>
        <span
          :if={@no_link?}
          class="ml-3 bg-white/95 grow overflow-hidden text-ellipsis p-3"
        >
          <.render_info
            id={@id}
            doc={@doc}
            hover_target={@hover_target}
            image_height={@image_height}
            geometry_indicator={@geometry_indicator}
            image_count={@image_count}
          />
        </span>
      </div>
      <.link
        navigate={
          if @publication_search? do
            ~p"/projects/search/#{@doc.project_identifier}/#{@doc.publication_draft_date}?#{%{filters: %{"category" => @doc.category.name}}}"
          else
            ~p"/search?#{%{filters: %{"category" => @doc.category.name}}}"
          end
        }
        class={"#{if !@is_first? && @is_grouped?, do: "hidden group-hover:block"} w-full -top-3 z-100 absolute suppress-link-styling rounded-tr  rounded-tl"}
        style={"background-color: #{desaturate_category_color(@doc.category.color)};"}
      >
        <div
          style={ "color: #{desaturate_category_color(@doc.category.color)};"}
          class="ml-3 font-bold text-sm pl-2 bg-white/80 hover:bg-white/70"
        >
          {pick_default_translation(@doc.category.labels)}
        </div>
      </.link>
    </div>
    """
  end

  def render_info(assigns) do
    ~H"""
    <% id = if @id, do: @id, else: "#{@doc.id}_link" %>
    <.maybe_map_hover_event id={"#{id}_map_hover"} doc={@doc} target_id={@hover_target}>
      <div>
        {@doc.identifier}
        <.icon
          :if={@geometry_indicator and @doc.geometry != nil}
          name="hero-map"
          class="mb-1"
        />
      </div>
      <div class="text-sm font-thin flex">
        <%= if @doc.description != %{} do %>
          {pick_default_translation(@doc.description)}
        <% end %>
      </div>
      <div>
        <% uuids = Enum.take(@doc.image_uuids, @image_count) %>
        <div id={"#{id}-images"} class="flex items-center overflow-x-auto">
          <%= for uuid <- uuids do %>
            <.img_element
              size={"^,#{@image_height}"}
              class="p-1 inline"
              project={@doc.project_identifier}
              uuid={uuid}
              alt={"An image depicting '#{@doc.identifier}'"}
            />
          <% end %>
        </div>
      </div>
    </.maybe_map_hover_event>
    """
  end

  def desaturate_category_color(color, alpha \\ 1) do
    "hsl(from  #{color} h calc(s * 0.5) l / #{alpha})"
  end

  defp construct_doc_link(project_identifier, draft_date, uuid, live_action) do
    uuid = if uuid == "project", do: "", else: uuid
    construct(project_identifier, draft_date, uuid, live_action)
  end

  defp construct(project_identifier, draft_date, uuid, nil) do
    ~p"/projects/#{project_identifier}/#{draft_date}/#{uuid}"
  end

  defp construct(project_identifier, draft_date, uuid, :map_dataseeet) do
    ~p"/projects/#{project_identifier}/#{draft_date}/#{uuid}/map"
  end

  defp construct(project_identifier, draft_date, uuid, :map_hierarchy) do
    ~p"/projects/#{project_identifier}/#{draft_date}/#{uuid}/map/hierarchy"
  end

  defp construct(project_identifier, draft_date, uuid, :map_context) do
    ~p"/projects/#{project_identifier}/#{draft_date}/#{uuid}/map/context"
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
