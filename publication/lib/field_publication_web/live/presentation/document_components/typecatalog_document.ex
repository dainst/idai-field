defmodule FieldPublicationWeb.Presentation.DocumentComponents.TypeCatalog do
  use Phoenix.Component
  use FieldPublicationWeb, :verified_routes

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
        <DocumentLink.show project={@project_name} date={@draft_date} lang={@lang} doc={@doc} />
      </.document_heading>

      <div class="flex flex-row">
        <div class="basis-1/3 m-5">
          <%= for relations <- @doc["relations"] do %>
            <.group_heading>
              <I18n.text values={relations["labels"]} /> (<%= Enum.count(relations["values"]) %>)
            </.group_heading>
            <div class="overflow-auto overscroll-contain max-h-[200px]">
              <%= for doc <- relations["values"] do %>
                <DocumentLink.show
                  project={@project_name}
                  date={@draft_date}
                  lang={@lang}
                  doc={doc}
                  image_count={0}
                />
              <% end %>
            </div>
          <% end %>
          <%= for group <- @doc["groups"] do %>
            <% fields =
              Enum.reject(group["fields"], fn %{"key" => key} ->
                key in ["identifier", "category", "geometry"]
              end) %>
            <%= unless fields == [] do %>
              <section>
                <.group_heading>
                  <I18n.text values={group["labels"]} />
                </.group_heading>

                <dl>
                  <%= for field <- fields do %>
                    <div>
                      <GenericField.render field={field} lang={@lang} />
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
              <a download={@doc["identifier"]} href={~p"/api/image/raw/#{@project_name}/#{@uuid}"}>
                <.icon name="hero-photo-solid" /> Download original
              </a>
            </li>
            <li>
              <a target="_blank" href={~p"/api/raw/csv/#{@project_name}/#{@draft_date}/#{@uuid}"}>
                <.icon name="hero-table-cells-solid" /> Download CSV
              </a>
            </li>
            <li>
              <a target="_blank" href={~p"/api/json/raw/#{@project_name}/#{@draft_date}/#{@uuid}"}>
                <span class="text-center inline-block w-[20px]" style="block">{}</span> Download JSON
              </a>
            </li>
          </ul>
        </div>
        <div class="basis-2/3 m-5">
          <h1>All Finds in this Catalog</h1>
          <%= for relations <- @doc["relations"] do %>
            <div class="overflow-auto overscroll-contain max-h-[200px]">
              <%= for linkeddoc <- relations["values"] do %>
                <!---
                and then we magically find all find-resources associated with this catalog
                # <%= linkeddoc["identifier"] %>
                --->
              <% end %>
            </div>
          <% end %>
        </div>
      </div>
    </div>
    """
  end
end
