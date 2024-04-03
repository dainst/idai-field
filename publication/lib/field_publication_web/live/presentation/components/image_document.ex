defmodule FieldPublicationWeb.Presentation.Components.ImageDocument do
  use Phoenix.Component
  use FieldPublicationWeb, :verified_routes

  alias FieldPublicationWeb.Presentation.Components.{
    I18n,
    IIIFViewer,
    GenericField,
    DocumentLink
  }

  alias FieldPublication.Publications.Data
  import FieldPublicationWeb.CoreComponents

  import FieldPublicationWeb.Presentation.Components.Typography

  def render(assigns) do
    ~H"""
    <div>
      <.document_heading>
        <%= Data.get_field_values(@doc, "identifier") %>
      </.document_heading>

      <div class="flex flex-row">
        <div class="basis-1/3 m-5">
          <% depicts = Data.get_relation_by_name(@doc, "depicts") %>
          <%= if depicts do %>
            <I18n.text values={depicts["labels"]} />:
            <%= for uuid <- depicts["values"] do %>
              <DocumentLink.show
                project={@project_name}
                date={@publication_date}
                lang={@lang}
                uuid={uuid}
              />
            <% end %>
          <% end %>
          <%= for group <- @doc["groups"] do %>
            <section>
              <.group_heading>
                <I18n.text values={group["labels"]} />
              </.group_heading>

              <dl>
                <%= for field <- group["fields"] |> Enum.reject(fn(%{"key" => key}) -> key in ["identifier", "category"] end)  do %>
                  <div>
                    <GenericField.render
                      values={field["values"]}
                      labels={field["labels"]}
                      lang={@lang}
                      type={field["type"]}
                    />
                  </div>
                <% end %>
              </dl>
            </section>
          <% end %>
          <hr class="mt-4" />

          <.group_heading>
            Raw data
          </.group_heading>
          <a class="mb-1" target="_blank" href={~p"/api/raw/image/#{@project_name}/#{@uuid}"}>
            <.icon name="hero-photo-solid" /> Download original
          </a>
          <br />
          <a
            class="mb-1"
            target="_blank"
            href={~p"/api/raw/csv/#{@project_name}/#{@publication_date}/#{@uuid}"}
          >
            <.icon name="hero-table-cells-solid" /> Download CSV
          </a>
          <br />
          <a
            class="mb-1"
            target="_blank"
            href={~p"/api/raw/json/#{@project_name}/#{@publication_date}/#{@uuid}"}
          >
            <span class="text-center inline-block w-[20px]" style="block">{}</span> Download JSON
          </a>
        </div>
        <div class="basis-2/3 m-5">
          <.live_component id="iiif_viewer" project={@project_name} uuid={@uuid} module={IIIFViewer} />
        </div>
      </div>
    </div>
    """
  end
end
