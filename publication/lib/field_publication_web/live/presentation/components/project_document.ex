defmodule FieldPublicationWeb.Presentation.Components.ProjectDocument do
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
        <I18n.text values={Data.get_field_values(@doc, "shortName")} lang={@lang} />
      </.document_heading>
      <div class="flex flex-row">
        <div class="basis-2/3 m-5">
          <.header>
            <%= gettext("project_doc_about_project") %>
          </.header>
          <div class="bg-slate-100 p-2 rounded">
            <I18n.markdown values={Data.get_field_values(@doc, "description")} lang={@lang} />
          </div>
          <.header class="mt-3">
            <%= gettext("project_doc_about_publication") %>
          </.header>
          <div class="bg-slate-100 p-2 rounded">
            <I18n.markdown values={@publication_comments} lang={@lang} />
          </div>

          <% depicted_in = Data.get_relation_by_name(@doc, "isDepictedIn") %>
          <%= if depicted_in do %>
            <.group_heading>
              <I18n.text values={depicted_in["labels"]} />
            </.group_heading>
            <div class="grid grid-cols-3 gap-1 mt-2">
              <%= for uuid <- depicted_in["values"] do %>
                <.link patch={"/#{@project_name}/#{@publication_date}/#{@lang}/#{uuid}"} class="p-1">
                  <Image.show size="300," project={@project_name} uuid={uuid} />
                </.link>
              <% end %>
            </div>
          <% end %>
        </div>

        <div class="basis-1/3 m-5">
          <% map_layers = Data.get_relation_by_name(@doc, "hasMapLayer") %>
          <%= if map_layers do %>
            <.live_component
              module={FieldPublicationWeb.Presentation.Components.ProjectMap}
              id="project_map"
              style="width:100%; height:300px;"
              layers={Map.get(map_layers, "values", [])}
              publication={@publication}
            />
          <% end %>
          <dl>
            <% institution = Data.get_field(@doc, "institution") %>
            <%= if institution do %>
              <GenericField.render
                values={institution["values"]}
                labels={institution["labels"]}
                lang={@lang}
                type={institution["type"]}
              />
            <% end %>

            <% supervisor = Data.get_field(@doc, "projectSupervisor") %>
            <%= if supervisor do %>
              <GenericField.render
                values={supervisor["values"]}
                labels={supervisor["labels"]}
                lang={@lang}
                type={supervisor["type"]}
              />
            <% end %>

            <% staff = Data.get_field(@doc, "staff") %>
            <%= if staff do %>
              <GenericField.render
                values={staff["values"]}
                labels={staff["labels"]}
                lang={@lang}
                type={staff["type"]}
              />
            <% end %>

            <% bibliographic_references = Data.get_field(@doc, "bibliographicReferences") %>
            <%= if bibliographic_references do %>
              <GenericField.render
                values={bibliographic_references["values"]}
                labels={bibliographic_references["labels"]}
                lang={@lang}
                type={bibliographic_references["type"]}
              />
            <% end %>

            <% contact_mail = Data.get_field(@doc, "contactMail") %>
            <% contact_person = Data.get_field(@doc, "contactPerson") %>
            <%= if contact_mail do %>
              <dt class="font-bold"><I18n.text values={contact_person["labels"]} lang={@lang} /></dt>
              <dd class="ml-4">
                <a href={"mailto:#{contact_mail["values"]}"}>
                  <.icon name="hero-envelope" class="h-6 w-6 mr-1" />
                  <%= if contact_person do %>
                    <%= contact_person["values"] %>
                  <% else %>
                    <%= gettext("contact_email") %>
                  <% end %>
                </a>
              </dd>
            <% end %>

            <% url = Data.get_field_values(@doc, "projectURI") %>
            <%= if url do %>
              <dt class="font-bold"><%= gettext("further_links") %></dt>
              <dd class="ml-4">
                <a href={url}>
                  <.icon name="hero-link" class="h-6 w-6 mr-1" /><%= gettext("project_home_page") %>
                </a>
              </dd>
            <% end %>
          </dl>
        </div>
      </div>
    </div>
    """
  end
end
