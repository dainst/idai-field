defmodule FieldPublicationWeb.Presentation.DocumentComponents do
  alias FieldPublication.DatabaseSchema.Publication
  use FieldPublicationWeb, :html
  use FieldPublicationWeb, :verified_routes

  alias FieldPublicationWeb.Presentation.Components.{
    I18n,
    Image,
    GenericField,
    DocumentLink,
    DocumentAncestors,
    IIIFViewer,
    ClipboardCopy
  }

  alias FieldPublication.Publications.Data

  alias FieldPublication.Publications.Data.{
    Document,
    FieldGroup,
    Field,
    RelationGroup
  }

  import FieldPublicationWeb.Presentation.Components.Typography

  attr :publication, Publication, required: true
  attr :doc, Document, required: true
  attr :lang, :string, required: true
  attr :focus, :atom, default: :default

  def generic(assigns) do
    ~H"""
    <div class="mb-4">
      <.document_heading>
        <DocumentLink.show lang={@lang} doc={@doc} />
      </.document_heading>
      <%= case @focus do %>
        <% :map -> %>
          <.generic_map {assigns} />
        <% _ -> %>
          <.generic_data_sheet {assigns} />
      <% end %>
    </div>
    """
  end

  defp generic_data_sheet(assigns) do
    ~H"""
    <div class="flex flex-row">
      <div class="basis-2/3">
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

              <dl class="grid grid-cols-2 gap-1 mt-2">
                <%= for %Field{} = field <- fields do %>
                  <div class="border p-0.5 border-black/20">
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
        <% depicted_in = Data.get_relation(@doc, "isDepictedIn") %>
        <%= if depicted_in do %>
          <section>
            <.group_heading>
              <I18n.text values={depicted_in.labels} /> ({Enum.count(depicted_in.docs)})
            </.group_heading>
            <div class="overflow-auto overscroll-contain grid grid-cols-3 gap-1 mt-2 max-h-[300px] mb-5">
              <%= for %Document{} = doc <- depicted_in.docs do %>
                <.link
                  patch={
                    ~p"/projects/#{@publication.project_name}/#{@publication.draft_date}/#{@lang}/#{doc.id}"
                  }
                  class="p-1"
                >
                  <div class="max-w-[250px]">
                    <Image.show
                      size="^250,"
                      project={@publication.project_name}
                      uuid={doc.id}
                      alt_text={"Project image '#{doc.identifier}' (#{I18n.select_translation(%{values: doc.category.labels}) |> then(fn {_, text} -> text end)})"}
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
                  ~p"/api/json/raw/#{@publication.project_name}/#{@publication.draft_date}/#{@doc.id}"
                }
              >
                <span class="text-center inline-block w-[20px]" style="block">{"{}"}</span>
                View JSON (raw)
              </a>
            </li>
            <li>
              <a
                class="mb-1"
                target="_blank"
                href={
                  ~p"/api/json/extended/#{@publication.project_name}/#{@publication.draft_date}/#{@doc.id}"
                }
              >
                <span class="text-center inline-block w-[20px]" style="block">{"{}"}</span>
                View JSON (extended)
              </a>
            </li>
          </ul>
        </section>
      </div>
      <div class="basis-1/3 ml-2">
        <div class="mb-4">
          <.live_component
            module={FieldPublicationWeb.Presentation.Components.DocumentViewMap}
            id="generic_doc_map"
            style="width:100%; height:500px;"
            doc={@doc}
            publication={@publication}
            lang={@lang}
          />
        </div>

        <%= for other_relation <- Enum.reject(
      @doc.relations,
      fn %RelationGroup{name: relation_name} -> relation_name in ["isDepictedIn", "hasDefaultMapLayer", "hasMapLayer"] end
      )  do %>
          <.group_heading>
            <I18n.text values={other_relation.labels} /> ({Enum.count(other_relation.docs)})
          </.group_heading>
          <div class="overflow-auto overscroll-contain max-h-[200px]">
            <%= for %Document{} = doc <- other_relation.docs do %>
              <DocumentLink.show lang={@lang} doc={doc} image_count={2} geometry_indicator={true} />
            <% end %>
          </div>
        <% end %>
      </div>
    </div>
    """
  end

  defp generic_map(assigns) do
    ~H"""
    <div class="flex flex-row">
      <div class="basis-1/3 pr-2">
        <.group_heading>
          Hierarchy
        </.group_heading>
        <div class="overflow-auto overscroll-contain h-(--full-size-doc-height)">
          <.live_component
            module={DocumentAncestors}
            id={"ancestors-#{@doc.id}"}
            doc={@doc}
            publication={@publication}
            lang={@lang}
            map_id="generic_doc_map_detail"
          />
          <%= for other_relation <- Enum.reject(
          @doc.relations,
          fn %RelationGroup{name: relation_name} -> relation_name in ["isDepictedIn", "hasDefaultMapLayer", "hasMapLayer", "isRecordedIn", "liesWithin", "contains"] end
          )  do %>
            <.group_heading>
              <I18n.text values={other_relation.labels} /> ({Enum.count(other_relation.docs)})
            </.group_heading>
            <div class="overflow-auto overscroll-contain">
              <%= for %Document{} = doc <- other_relation.docs do %>
                <% geometry = Data.get_field(doc, "geometry") %>

                <%= if geometry do %>
                  <div
                    id={"ancester_link_#{doc.id}"}
                    phx-hook="HoverHighlightMapFeature"
                    target_dom_element="generic_doc_map_detail"
                    target_id={doc.id}
                  >
                    <DocumentLink.show
                      lang={@lang}
                      doc={doc}
                      image_count={10}
                      geometry_indicator={true}
                    />
                  </div>
                <% else %>
                  <div>
                    <DocumentLink.show
                      lang={@lang}
                      doc={doc}
                      image_count={10}
                      geometry_indicator={true}
                    />
                  </div>
                <% end %>
              <% end %>
            </div>
          <% end %>
        </div>
      </div>
      <div class="basis-2/3">
        <div class="mb-4">
          <.live_component
            module={FieldPublicationWeb.Presentation.Components.DocumentViewMap}
            id="generic_doc_map_detail"
            style="width:100%; height: calc(-300px + 100vh);"
            doc={@doc}
            publication={@publication}
            lang={@lang}
            focus={@focus}
          />
        </div>
      </div>
    </div>
    """
  end

  attr :publication, Publication, required: true
  attr :doc, Document, required: true
  attr :lang, :string, required: true

  def image(assigns) do
    ~H"""
    <div>
      <.document_heading>
        <DocumentLink.show lang={@lang} doc={@doc} />
      </.document_heading>

      <div class="flex flex-col-reverse lg:flex-row">
        <div class="basis-full lg:basis-1/3 m-5">
          <%= for %RelationGroup{} = relation_group <- @doc.relations do %>
            <.group_heading>
              <I18n.text values={relation_group.labels} /> ({Enum.count(relation_group.docs)})
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
            Data formats
          </.group_heading>
          <ul class="ml-0 list-none">
            <li>
              <a
                download={@doc.identifier}
                href={~p"/api/image/raw/#{@publication.project_name}/#{@doc.id}"}
              >
                <.icon name="hero-photo-solid" /> Download original
              </a>
            </li>
            <li>
              <a
                target="_blank"
                href={
                  ~p"/api/json/raw/#{@publication.project_name}/#{@publication.draft_date}/#{@doc.id}"
                }
              >
                <span class="text-center inline-block w-[20px]" style="block">{"{}"}</span>
                View JSON (raw)
              </a>
            </li>
            <li>
              <a
                target="_blank"
                href={
                  ~p"/api/json/extended/#{@publication.project_name}/#{@publication.draft_date}/#{@doc.id}"
                }
              >
                <span class="text-center inline-block w-[20px]" style="block">{"{}"}</span>
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
                  copy_value={"#{FieldPublicationWeb.Endpoint.url()}/#{IIIFViewer.construct_url(@publication.project_name, @doc.id)}"}
                  module={ClipboardCopy}
                >
                  Copy IIIF link
                </.live_component>
              </div>
            </li>
          </ul>
        </div>
        <div class="basis-full lg:basis-2/3 m-5">
          <.live_component
            class="h-(--fifty-percent-vh) lg:h-(--full-size-doc-height)"
            id="iiif_viewer"
            project={@publication.project_name}
            uuid={@doc.id}
            module={IIIFViewer}
          />
        </div>
      </div>
    </div>
    """
  end

  attr :publication, Publication, required: true
  attr :doc, Document, required: true
  attr :lang, :string, required: true
  attr :top_level_docs, :list, default: []

  def project(assigns) do
    ~H"""
    <div>
      <.document_heading>
        <I18n.text values={Data.get_field_value(@doc, "shortName")} lang={@lang} />
      </.document_heading>
      <div class="flex flex-row">
        <div class="basis-2/3 m-5">
          <.header>
            {gettext("project_doc_about_project")}
          </.header>
          <div class="bg-slate-50 p-2 rounded">
            <% depicted_in = Data.get_relation(@doc, "isDepictedIn") %>
            <%= if depicted_in != nil do %>
              <div class="float-left overflow-auto overscroll-contain max-h-[310px] mr-3 mb-2">
                <%= for %Data.Document{} = doc <- depicted_in.docs do %>
                  <.link
                    patch={
                      ~p"/projects/#{@publication.project_name}/#{@publication.draft_date}/#{@lang}/#{doc.id}"
                    }
                    class="p-1"
                  >
                    <div class="w-[300px] pr-1">
                      <Image.show size="^300," project={@publication.project_name} uuid={doc.id} />
                    </div>
                  </.link>
                <% end %>
              </div>
            <% end %>
            <I18n.markdown values={Data.get_field_value(@doc, "description")} lang={@lang} />
          </div>
          <.header class="mt-3">
            {gettext("project_doc_about_publication")}
          </.header>
          <div class="bg-slate-50 p-2 rounded">
            <I18n.markdown
              values={
                @publication.comments
                |> Enum.map(fn %{language: lang, text: text} -> {lang, text} end)
                |> Enum.into(%{})
              }
              lang={@lang}
            />
          </div>
        </div>

        <div class="basis-1/3 m-5">
          <% map_layers = Data.get_relation(@doc, "hasDefaultMapLayer") %>
          <%= if map_layers do %>
            <div class="mb-4">
              <.live_component
                module={FieldPublicationWeb.Presentation.Components.DocumentViewMap}
                id="project_doc_map"
                style="width:100%; height:500px;"
                doc={@doc}
                publication={@publication}
                lang={@lang}
              />
            </div>
          <% end %>
          <dl>
            <% institution = Data.get_field(@doc, "institution") %>
            <%= if institution do %>
              <dt class="font-bold"><I18n.text values={institution.labels} /></dt>
              <GenericField.render field={institution} lang={@lang} />
            <% end %>

            <% contact_mail = Data.get_field(@doc, "contactMail") %>
            <% contact_person = Data.get_field(@doc, "contactPerson") %>
            <%= if contact_mail do %>
              <dt class="font-bold"><I18n.text values={contact_person.labels} /></dt>
              <dd class="ml-4">
                <a href={"mailto:#{contact_mail.value}"}>
                  <.icon name="hero-envelope" class="h-6 w-6 mr-1" />
                  <%= if contact_person do %>
                    {contact_person.value}
                  <% else %>
                    {gettext("contact_email")}
                  <% end %>
                </a>
              </dd>
            <% end %>

            <% supervisor = Data.get_field(@doc, "projectSupervisor") %>
            <%= if supervisor do %>
              <dt class="font-bold"><I18n.text values={supervisor.labels} /></dt>
              <GenericField.render field={supervisor} lang={@lang} />
            <% end %>

            <% staff = Data.get_field(@doc, "staff") %>
            <%= if staff do %>
              <dt class="font-bold"><I18n.text values={staff.labels} lang={@lang} /></dt>
              <dd class="ml-4">
                {Enum.join(staff.value, ", ")}
              </dd>
            <% end %>

            <% bibliographic_references = Data.get_field(@doc, "bibliographicReferences") %>
            <%= if bibliographic_references do %>
              <dt class="font-bold"><I18n.text values={bibliographic_references.labels} /></dt>
              <GenericField.render field={bibliographic_references} lang={@lang} />
            <% end %>
            <% url = Data.get_field_value(@doc, "projectURI") %>
            <%= if url do %>
              <dt class="font-bold">{gettext("further_links")}</dt>
              <dd class="ml-4">
                <a href={url}>
                  <.icon name="hero-link" class="h-6 w-6 mr-1" />{gettext("project_home_page")}
                </a>
              </dd>
            <% end %>
          </dl>

          <.group_heading>
            {gettext("Main documents")}
          </.group_heading>
          <%= for %Document{} = doc <- @top_level_docs do %>
            <DocumentLink.show lang={@lang} doc={doc} />
          <% end %>
        </div>
      </div>
    </div>
    """
  end
end
