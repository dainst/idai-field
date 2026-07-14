defmodule FieldPublicationWeb.Presentation.Document.GenericDatasheet do
  use FieldPublicationWeb, :live_component

  import FieldPublicationWeb.Components.Data.{
    DocumentLink,
    Field,
    Image
  }

  alias FieldPublication.DatabaseSchema.Publication
  alias FieldPublication.Publications.Data

  alias FieldPublication.Publications.Data.{
    Document,
    Field,
    FieldGroup,
    RelationGroup
  }

  def render(assigns) do
    ~H"""
    <div class="flex flex-col lg:flex-row">
      <div class="lg:basis-2/3">
        <%= for %FieldGroup{} = group <- @doc.groups do %>
          <% fields =
            Enum.reject(group.fields, fn %Field{name: name} ->
              name in ["identifier", "category", "geometry"]
            end) %>
          <%= unless fields == [] do %>
            <section>
              <.group_heading>
                {pick_default_translation(group.labels)}
              </.group_heading>

              <div class="grid max-md:grid-cols-1 md:grid-cols-2 gap-1 mt-2">
                <%= for %Field{} = field <- fields do %>
                  <.labeled_value class="border p-0.5 border-black/20">
                    <:label><.render_field_label field={field} /></:label>
                    <.render_field_data field={field} publication={@publication} />
                  </.labeled_value>
                <% end %>
              </div>
            </section>
          <% end %>
        <% end %>
        <% depicted_in = Data.get_relation(@doc, "isDepictedIn") %>
        <%= if depicted_in do %>
          <section>
            <.group_heading>
              {pick_default_translation(depicted_in.labels)} ({Enum.count(depicted_in.docs)})
            </.group_heading>
            <div class="p-2 bg-panel overflow-auto overscroll-contain grid grid-cols-3 gap-1 mt-2 max-h-[300px] mb-5">
              <%= for %Document{} = doc <- depicted_in.docs do %>
                <.link navigate={
                  ~p"/projects/#{@publication.project_identifier}/#{@publication.draft_date}/#{doc.id}"
                }>
                  <div class="max-w-[250px]">
                    <.img_element
                      size="^250,"
                      project={@publication.project_identifier}
                      uuid={doc.id}
                      alt={"Project image '#{doc.identifier}' (#{pick_default_translation(doc.category.labels)})"}
                    />
                  </div>
                </.link>
              <% end %>
            </div>
          </section>
        <% end %>
        <section>
          <.group_heading>
            Data formats
          </.group_heading>
          <ul class="ml-0 list-none">
            <li>
              <a
                class="mb-1"
                target="_blank"
                href={
                  ~p"/api/json/raw/#{@publication.project_identifier}/#{@publication.draft_date}/#{@doc.id}"
                }
              >
                <span class="text-center inline-block w-5" style="block">{"{}"}</span> View JSON (raw)
              </a>
            </li>
            <li>
              <a
                class="mb-1"
                target="_blank"
                href={
                  ~p"/api/json/extended/#{@publication.project_identifier}/#{@publication.draft_date}/#{@doc.id}"
                }
              >
                <span class="text-center inline-block w-5" style="block">{"{}"}</span>
                View JSON (extended)
              </a>
            </li>
          </ul>
        </section>
      </div>
      <div class="lg:basis-1/3 flex flex-col lg:flex-col-reverse lg:ml-2 lg:justify-end">
        <%= for other_relation <- Enum.reject(
      @doc.relations,
      fn %RelationGroup{name: relation_name} -> relation_name in ["isDepictedIn", "hasDefaultMapLayer", "hasMapLayer"] end
      )  do %>
          <section>
            <.group_heading>
              {pick_default_translation(other_relation.labels)} ({Enum.count(other_relation.docs)})
            </.group_heading>
            <div class="overflow-auto overscroll-contain max-h-[400px]">
              <%= for doc <- other_relation.docs do %>
                <.document_link
                  id={"#{other_relation.name}-#{doc.id}"}
                  doc={doc}
                  image_count={10}
                  geometry_indicator={true}
                  hover_target="generic_doc_map"
                />
              <% end %>
            </div>
          </section>
        <% end %>
        <div class="lg:mb-4">
          <.group_heading>
            Geometry <span class="text-xs">({@geometry_type})</span>
            <.link patch={
              ~p"/projects/#{@publication.project_identifier}/#{@publication.draft_date}/#{@doc.id}/map"
            }>
              <.icon name="hero-arrows-pointing-out" />
            </.link>
          </.group_heading>
          <.live_component
            module={FieldPublicationWeb.Presentation.Components.DocumentViewMap}
            id="generic_doc_map"
            style="width:100%; height:500px;"
            doc={@doc}
            publication={@publication}
          />
        </div>
      </div>
    </div>
    """
  end

  def update(%{doc: %Document{} = doc, publication: %Publication{} = publication}, socket) do
    geometry_type =
      case doc.geometry do
        %{"type" => type} ->
          type

        _ ->
          "None"
      end

    {
      :ok,
      socket
      |> assign(:doc, doc)
      |> assign(:publication, publication)
      |> assign(:geometry_type, geometry_type)
    }
  end
end
