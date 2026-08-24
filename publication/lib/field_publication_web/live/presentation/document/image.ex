defmodule FieldPublicationWeb.Presentation.Document.Image do
  use FieldPublicationWeb, :live_component

  import FieldPublicationWeb.Components.Data.{
    DocumentLink,
    Field,
    Image
  }

  alias FieldPublication.DatabaseSchema.Publication

  alias FieldPublication.Publications.Data.{
    Document,
    Field,
    FieldGroup,
    RelationGroup
  }

  alias FieldPublicationWeb.Components.ClipboardCopy

  def render(assigns) do
    ~H"""
    <div class="flex flex-col-reverse lg:flex-row">
      <div class="basis-full lg:basis-1/3">
        <%= for %FieldGroup{} = group <- @doc.groups do %>
          <% fields =
            Enum.reject(group.fields, fn %Field{name: name} ->
              name in ["identifier", "category", "geometry"]
            end) %>
          <%= unless fields == [] do %>
            <section class="flex flex-col gap-1">
              <.group_heading>
                {pick_default_translation(group.labels)}
              </.group_heading>

              <%= for %Field{} = field <- fields do %>
                <.render_field field={field} publication={@publication} />
              <% end %>
            </section>
          <% end %>
        <% end %>
        <%= for %RelationGroup{} = relation_group <- @doc.relations do %>
          <.group_heading>
            {pick_default_translation(relation_group.labels)} ({Enum.count(relation_group.docs)})
          </.group_heading>
          <section>
            <%= for %Document{} = doc <- relation_group.docs do %>
              <.document_link doc={doc} image_count={0} />
            <% end %>
          </section>
        <% end %>
        <.group_heading>
          Data formats
        </.group_heading>
        <ul class="ml-0 list-none">
          <li>
            <a
              download={@doc.identifier}
              href={~p"/api/v1/#{@publication.project_identifier}/image/#{@doc.id}"}
            >
              <.icon name="hero-photo-solid" /> Download original
            </a>
          </li>
          <li>
            <a
              target="_blank"
              href={
                ~p"/api/v1/#{@publication.project_identifier}/#{@publication.draft_date}/doc/#{@doc.id}"
              }
            >
              <span class="text-center inline-block w-5" style="block">{"{}"}</span> View JSON
            </a>
          </li>
          <li>
            <a
              target="_blank"
              href={
                ~p"/api/v1/#{@publication.project_identifier}/#{@publication.draft_date}/doc/#{@doc.id}/extended"
              }
            >
              <span class="text-center inline-block w-5" style="block">{"{}"}</span>
              View JSON (extended)
            </a>
          </li>
          <li>
            <div>
              <a href="https://iiif.io" target="_blank">
                <img src="/images/iiif-logo.png" class="inline h-4" />
              </a>

              <.live_component
                id="iiif-link"
                copy_value={"#{FieldPublicationWeb.Endpoint.url()}#{construct_iiif_info_url(@publication.project_identifier, @doc.id)}"}
                module={ClipboardCopy}
              >
                Copy IIIF link
              </.live_component>
            </div>
          </li>
        </ul>
      </div>
      <div class="basis-full mt-2 lg:mt-0 lg:ml-2 lg:basis-2/3">
        <.iiif_viewer
          class="h-(--ol-full-height) p-2 bg-panel"
          id="iiif_viewer"
          project={@publication.project_identifier}
          uuid={@doc.id}
        />
      </div>
    </div>
    """
  end

  def update(%{doc: %Document{} = doc, publication: %Publication{} = publication}, socket) do
    {
      :ok,
      socket
      |> assign(:doc, doc)
      |> assign(:publication, publication)
    }
  end
end
