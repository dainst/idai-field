defmodule FieldPublicationWeb.Presentation.Document.TypeCatalog do
  use FieldPublicationWeb, :live_component

  import FieldPublicationWeb.Components.Data.{
    DocumentLink
  }

  alias FieldPublication.Publications.Data.{
    Document,
    RelationGroup
  }

  def render(assigns) do
    ~H"""
    <div class="lg:basis-1/3 flex flex-col lg:flex-col-reverse lg:ml-2 lg:justify-end">
      <%= for other_relation <- Enum.reject(
      @doc.relations,
      fn %RelationGroup{name: relation_name} -> relation_name in ["isDepictedIn", "hasDefaultMapLayer", "hasMapLayer"] end
      )  do %>
        <section>
          <.group_heading>
            {pick_default_translation(other_relation.labels)} ({Enum.count(other_relation.docs)})
          </.group_heading>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-1 overflow-y-auto max-h-[200vh]">
            <%= for %Document{geometry: geometry} = doc <- other_relation.docs do %>
              <%= if geometry do %>
                <div
                  id={"relations_map_highlighter_#{doc.id}"}
                  phx-hook="HoverHighlightMapFeature"
                  target_dom_element="generic_doc_map"
                  target_id={doc.id}
                >
                  <.document_link
                    doc={doc}
                    image_count={10}
                    geometry_indicator={true}
                  />
                </div>
              <% else %>
                <.document_link doc={doc} image_count={10} geometry_indicator={true} />
              <% end %>
            <% end %>
          </div>
        </section>
      <% end %>
    </div>
    """
  end

  def update(%{doc: doc, publication: publication} = _assigns, socket) do
    {
      :ok,
      socket
      |> assign(:doc, doc)
      |> assign(:publication, publication)
    }
  end
end
