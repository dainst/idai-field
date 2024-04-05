defmodule FieldPublicationWeb.Presentation.Components.ProjectDocument do
  use FieldPublicationWeb, :html

  alias FieldPublicationWeb.Presentation.Components.{
    I18n,
    Image,
    DocumentLink
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
          <I18n.markdown values={Data.get_field_values(@doc, "description")} lang={@lang} />

          <.header>
            <%= gettext("project_doc_about_publication") %>
          </.header>
          <I18n.markdown values={@publication_comments} lang={@lang} />

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
          <% map_layers = Data.get_relation_by_name(@doc, "hasMapLayer") %>
          <%= if map_layers do %>
            <.live_component
              module={FieldPublicationWeb.Presentation.Components.ProjectMap}
              id="project_map"
              style="width:100%; height:75vh;"
              layers={Map.get(map_layers, "values", [])}
              publication={@publication}
            />
          <% end %>
        </div>

        <div class="basis-1/3 m-5">
          <dl>
            <dt class="font-semibold">
              <I18n.text values={Data.get_field_labels(@doc, "institution")} />
            </dt>
            <dd class="ml-2">
              <%= Data.get_field_values(@doc, "institution") %>
            </dd>
            <dt class="font-semibold">
              <I18n.text values={Data.get_field_labels(@doc, "projectSupervisor")} />
            </dt>
            <dd class="ml-2">
              <%= Data.get_field_values(@doc, "projectSupervisor") %>
            </dd>
            <dt class="font-semibold">
              <I18n.text values={Data.get_field_labels(@doc, "contactPerson")} />
            </dt>
            <dd class="ml-2">
              <%= Data.get_field_values(@doc, "contactPerson") %> (<%= Data.get_field_values(
                @doc,
                "contactMail"
              ) %>)
            </dd>
          </dl>
        </div>
      </div>
    </div>
    """
  end
end
