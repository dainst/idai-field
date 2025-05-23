defmodule FieldPublicationWeb.Presentation.Components.DocumentAncestors do
  alias FieldPublicationWeb.Presentation.Components.DocumentLink
  alias FieldPublication.Publications.Data
  alias FieldPublication.Publications.Data.Document
  alias FieldPublication.DatabaseSchema.Publication
  alias FieldPublication.Publications
  use FieldPublicationWeb, :live_component

  def render(assigns) do
    ~H"""
    <div>
      <.render_step nodes={@ancestors} lang={@lang} map_id={@map_id} focus={@focus} />
    </div>
    """
  end

  defp render_step(assigns) do
    ~H"""
    <%= case @nodes do %>
      <% [current] -> %>
        <div class="bg-slate-200">
          <.render_link doc={current} hover_target={@map_id} lang={@lang} focus={@focus} />
        </div>
        <% contains = Data.get_relation(current, "contains") %>
        <%= if contains do %>
          <div class="flex flex-row">
            <.icon name="hero-arrow-turn-down-right" class="min-w-8" />
            <div>
              <%= for doc <- contains.docs do %>
                <.render_link doc={doc} hover_target={@map_id} lang={@lang} focus={@focus} />
              <% end %>
            </div>
          </div>
        <% end %>
      <% [current | rest] -> %>
        <.render_link doc={current} hover_target={@map_id} lang={@lang} focus={@focus} />

        <div class="flex flex-row">
          <.icon name="hero-arrow-turn-down-right min-w-8" />
          <div>
            <.render_step nodes={rest} lang={@lang} map_id={@map_id} focus={@focus} />
          </div>
        </div>
      <% [] -> %>
        None
    <% end %>
    """
  end

  attr :doc, Document, required: true
  attr :hover_target, :string, required: true
  attr :lang, :string, required: true
  attr :focus, :atom, required: true

  def render_link(assigns) do
    ~H"""
    <% geometry = Data.get_field(@doc, "geometry") %>

    <%= if geometry do %>
      <div
        id={"ancester_link_#{@doc.id}"}
        phx-hook="HoverHighlightMapFeature"
        target_dom_element={@hover_target}
        target_id={@doc.id}
      >
        <DocumentLink.show
          lang={@lang}
          doc={@doc}
          image_count={10}
          geometry_indicator={true}
          focus={@focus}
        />
      </div>
    <% else %>
      <div>
        <DocumentLink.show
          lang={@lang}
          doc={@doc}
          image_count={10}
          geometry_indicator={true}
          focus={@focus}
        />
      </div>
    <% end %>
    """
  end

  def update(
        %{
          doc: %Document{id: id} = doc,
          publication: %Publication{} = publication,
          lang: lang,
          map_id: map_id
        } = params,
        socket
      ) do
    tree =
      publication
      |> Publications.get_hierarchy()
      |> construct_ancestor_tree(id, [])

    ancestors = Data.get_extended_documents(tree, publication) ++ [doc]

    {
      :ok,
      socket
      |> assign(:ancestors, ancestors)
      |> assign(:lang, lang)
      |> assign(:map_id, map_id)
      |> assign(:focus, Map.get(params, :focus, :default))
    }
  end

  defp construct_ancestor_tree(hierarchy, id, children) do
    Map.get(hierarchy, id, %{})
    |> case do
      %{"parent" => nil} ->
        children

      %{"parent" => parent_id} ->
        construct_ancestor_tree(hierarchy, parent_id, [parent_id] ++ children)

      _ ->
        children
    end
  end
end
