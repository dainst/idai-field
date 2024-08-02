defmodule FieldPublicationWeb.Presentation.DocumentComponents.Image do
  use Phoenix.Component
  use FieldPublicationWeb, :verified_routes

  alias FieldPublication.Publications.Data.Field
  alias FieldPublication.Publications.Data.FieldGroup
  alias FieldPublication.Publications.Data.Document
  alias FieldPublication.Publications.Data.RelationGroup

  alias FieldPublicationWeb.Presentation.Components.{
    I18n,
    IIIFViewer,
    GenericField,
    DocumentLink,
    ClipboardCopy
  }

  import FieldPublicationWeb.CoreComponents

  import FieldPublicationWeb.Presentation.Components.Typography

  def render(assigns) do
    ~H"""
    <div>
      <.document_heading>
        <DocumentLink.show lang={@lang} doc={@doc} />
      </.document_heading>

      <div class="flex flex-row">
        <div class="basis-1/3 m-5">
          <%= for %RelationGroup{} = relation_group <- @doc.relations do %>
            <.group_heading>
              <I18n.text values={relation_group.labels} /> (<%= Enum.count(relation_group.docs) %>)
            </.group_heading>
            <div class="overflow-auto overscroll-contain max-h-[200px]">
              <%= for %Document{} = doc <- relation_group.docs do %>
                <DocumentLink.show lang={@lang} doc={doc} image_count={0} />
              <% end %>
            </div>
          <% end %>
          <%= for %FieldGroup{} = group <- @doc.groups do %>
            <% fields =
              Enum.reject(group.fields, fn %Field{name: name} ->
                name in ["identifier", "category", "geometry"]
              end) %>
            <%= unless fields == [] do %>
              <section>
                <.group_heading>
                  <I18n.text values={group.labels} />
                </.group_heading>

                <dl>
                  <%= for %Field{} = field <- fields do %>
                    <div>
                      <dt class="font-bold"><I18n.text values={field.labels} /></dt>
                      <dd class="pl-4">
                        <GenericField.render field={field} lang={@lang} />
                      </dd>
                    </div>
                  <% end %>
                </dl>
              </section>
            <% end %>
          <% end %>
          <hr class="mt-4" />

          <.group_heading>
            Raw data
          </.group_heading>
          <ul class="ml-0 list-none">
            <li>
              <a
                download={@doc.identifier}
                href={~p"/api/image/raw/#{@publication.project_name}/#{@uuid}"}
              >
                <.icon name="hero-photo-solid" /> Download original
              </a>
            </li>
            <li>
              <a
                target="_blank"
                href={
                  ~p"/api/raw/csv/#{@publication.project_name}/#{@publication.draft_date}/#{@uuid}"
                }
              >
                <.icon name="hero-table-cells-solid" /> Download CSV
              </a>
            </li>
            <li>
              <a
                target="_blank"
                href={
                  ~p"/api/json/raw/#{@publication.project_name}/#{@publication.draft_date}/#{@uuid}"
                }
              >
                <span class="text-center inline-block w-[20px]" style="block">{}</span> Download JSON
              </a>
            </li>
            <li>
              <div>
                <a href="https://iiif.io" target="_blank">
                  <img src="/images/iiif-logo.png" class="inline h-4" />
                </a>
                <.live_component
                  id="iiif-link"
                  copy_value={"#{FieldPublicationWeb.Endpoint.url()}/#{IIIFViewer.construct_url(@publication.project_name, @uuid)}"}
                  module={ClipboardCopy}
                >
                  Copy IIIF link
                </.live_component>
              </div>
            </li>
          </ul>
        </div>
        <div class="basis-2/3 m-5">
          <.live_component
            class="h-full"
            id="iiif_viewer"
            project={@publication.project_name}
            uuid={@uuid}
            module={IIIFViewer}
          />
        </div>
      </div>
    </div>
    """
  end
end
