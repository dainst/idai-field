defmodule FieldPublicationWeb.Presentation.DocumentComponents.Project do
  alias FieldPublicationWeb.Presentation.Components.DocumentLink
  use FieldPublicationWeb, :html

  alias FieldPublicationWeb.Presentation.Components.{
    I18n,
    Image,
    GenericField
  }

  alias FieldPublication.Publications.Data

  import FieldPublicationWeb.Presentation.Components.Typography

  def render(assigns) do
    ~H"""
    <div>
      <.document_heading>
        <I18n.text values={Data.get_field_value(@doc, "shortName")} lang={@lang} />
      </.document_heading>
      <div class="flex flex-row">
        <div class="basis-2/3 m-5">
          <.header>
            <%= gettext("project_doc_about_project") %>
          </.header>
          <div class="bg-slate-50 p-2 rounded">
            <% depicted_in = Data.get_relation(@doc, "isDepictedIn") %>
            <%= if depicted_in do %>
              <div class="float-left overflow-auto overscroll-contain max-h-[310px] mr-3 mb-2">
                <%= for doc <- depicted_in.value do %>
                  <.link
                    patch={
                      ~p"/projects/#{@publication.project_name}/#{@publication.draft_date}/#{@lang}/#{doc["id"]}"
                    }
                    class="p-1"
                  >
                    <div class="w-[300px] pr-1">
                      <Image.show size="^300," project={@publication.project_name} uuid={doc["id"]} />
                    </div>
                  </.link>
                <% end %>
              </div>
            <% end %>
            <I18n.markdown values={Data.get_field_value(@doc, "description")} lang={@lang} />
          </div>
          <.header class="mt-3">
            <%= gettext("project_doc_about_publication") %>
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
                module={FieldPublicationWeb.Presentation.Components.ProjectMap}
                id="project_doc_map"
                style="width:100%; height:300px;"
                project_layer_documents={@project_map_layers}
                additional_layer_documents={[]}
                highlighted_geometry_documents={[]}
                additional_geometry_documents={[]}
                project_name={@publication.project_name}
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
                    <%= contact_person.value %>
                  <% else %>
                    <%= gettext("contact_email") %>
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
                <%= Enum.join(staff.value, ", ") %>
              </dd>
            <% end %>

            <% bibliographic_references = Data.get_field(@doc, "bibliographicReferences") %>
            <%= if bibliographic_references do %>
              <dt class="font-bold"><I18n.text values={bibliographic_references.labels} /></dt>
              <GenericField.render field={bibliographic_references} lang={@lang} />
            <% end %>
            <% url = Data.get_field_value(@doc, "projectURI") %>
            <%= if url do %>
              <dt class="font-bold"><%= gettext("further_links") %></dt>
              <dd class="ml-4">
                <a href={url}>
                  <.icon name="hero-link" class="h-6 w-6 mr-1" /><%= gettext("project_home_page") %>
                </a>
              </dd>
            <% end %>
          </dl>

          <.group_heading>
            <%= gettext("Main documents") %>
          </.group_heading>
          <%= for doc <- @top_level_docs do %>
            <DocumentLink.show lang={@lang} doc={doc} />
          <% end %>
        </div>
      </div>
    </div>
    """
  end
end
