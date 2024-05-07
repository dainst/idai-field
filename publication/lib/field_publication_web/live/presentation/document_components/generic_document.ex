defmodule FieldPublicationWeb.Presentation.DocumentComponents.Generic do
  use FieldPublicationWeb, :html
  use FieldPublicationWeb, :verified_routes

  alias FieldPublicationWeb.Presentation.Components.{
    I18n,
    Image,
    GenericField,
    DocumentLink
  }

  alias FieldPublication.Publications.Data
  alias FieldPublicationWeb.Presentation.Components.ViewSelection

  import FieldPublicationWeb.CoreComponents
  import FieldPublicationWeb.Presentation.Components.Typography

  def render(assigns) do
    ~H"""
    <div>
      <ViewSelection.render
        project={@project_name}
        date={@publication_date}
        lang={@lang}
        uuid={@uuid}
      />
      <.document_heading>
        <DocumentLink.show
          project={@project_name}
          date={@publication_date}
          lang={@lang}
          preview_doc={@doc}
        />
      </.document_heading>

      <div class="flex flex-row">
        <div class="basis-2/3">
          <%= for group <- @doc["groups"] do %>
            <section>
              <.group_heading>
                <I18n.text values={group["labels"]} />
              </.group_heading>

              <dl class="grid grid-cols-2 gap-1 mt-2">
                <%= for field <- group["fields"] |> Enum.reject(fn(%{"key" => key}) -> key in ["identifier", "category"] end)  do %>
                  <div class="border-2 p-0.5">
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
        </div>
        <div class="basis-1/3 ml-2">
          <% depicted_in = Data.get_relation_by_name(@doc, "isDepictedIn") %>
          <%= if depicted_in do %>
            <.group_heading>
              <I18n.text values={depicted_in["labels"]} /> (<%= Enum.count(depicted_in["values"]) %>)
            </.group_heading>
            <div class="overflow-auto overscroll-contain grid grid-cols-3 gap-1 mt-2 max-h-[300px] mb-5">
              <%= for preview_doc <- depicted_in["values"] do %>
                <.link
                  patch={"/#{@project_name}/#{@publication_date}/#{@lang}/#{preview_doc["id"]}"}
                  class="p-1"
                >
                  <div class="max-w-[250px]">
                    <Image.show size="250," project={@project_name} uuid={preview_doc["id"]} />
                  </div>
                </.link>
              <% end %>
            </div>
          <% end %>
          <%= for other_relation <- @doc["relations"]
                  |> Enum.reject(fn %{"key" => key} -> key in ["isDepictedIn"] end)  do %>
            <.group_heading>
              <I18n.text values={other_relation["labels"]} />
              (<%= Enum.count(other_relation["values"]) %>)
            </.group_heading>
            <div class="overflow-auto overscroll-contain max-h-[200px]">
              <%= for preview_doc <- other_relation["values"] do %>
                <DocumentLink.show
                  project={@project_name}
                  date={@publication_date}
                  lang={@lang}
                  preview_doc={preview_doc}
                />
              <% end %>
            </div>
          <% end %>
          <%= if @child_doc_previews != [] do %>
            <.group_heading>
              <%= gettext("Contains") %> (<%= Enum.count(@child_doc_previews) %>)
            </.group_heading>
            <div class="overflow-auto overscroll-contain max-h-[400px]">
              <%= for doc <- @child_doc_previews do %>
                <DocumentLink.show
                  project={@project_name}
                  date={@publication_date}
                  lang={@lang}
                  preview_doc={doc}
                />
              <% end %>
            </div>
          <% end %>

          <.group_heading>
            Raw data
          </.group_heading>
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
      </div>
    </div>
    """
  end
end