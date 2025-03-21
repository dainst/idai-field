defmodule FieldPublicationWeb.Presentation.DocumentComponents.Generic do
  alias FieldPublication.Publications.Data.RelationGroup
  use FieldPublicationWeb, :html
  use FieldPublicationWeb, :verified_routes

  alias FieldPublicationWeb.Presentation.Components.{
    I18n,
    Image,
    GenericField,
    DocumentLink
  }

  alias FieldPublication.Publications.Data

  alias FieldPublication.Publications.Data.{
    Document,
    FieldGroup,
    Field
  }

  alias FieldPublicationWeb.Presentation.Components.ViewSelection

  import FieldPublicationWeb.Presentation.Components.Typography

  def render(assigns) do
    ~H"""
    <div>
      <.document_heading>
        <DocumentLink.show lang={@lang} doc={@doc} />
      </.document_heading>
      <div class="flex flex-row">
        <div class="basis-2/3">
          <ViewSelection.render
            project={@publication.project_name}
            date={@publication.draft_date}
            lang={@lang}
            uuid={@uuid}
            current={:detail}
          />
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
                    <div class="border-2 p-0.5">
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
          <% depicted_in = Data.get_relation(@doc, "isDepictedIn") %>
          <%= if depicted_in do %>
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
          <% end %>
          <%= for other_relation <- Enum.reject(
            @doc.relations,
            fn %RelationGroup{name: relation_name} -> relation_name in ["isDepictedIn", "hasDefaultMapLayer", "hasMapLayer"] end
            )  do %>
            <.group_heading>
              <I18n.text values={other_relation.labels} /> ({Enum.count(other_relation.docs)})
            </.group_heading>
            <div class="overflow-auto overscroll-contain max-h-[200px]">
              <%= for %Document{} = doc <- other_relation.docs do %>
                <DocumentLink.show lang={@lang} doc={doc} image_count={2} />
              <% end %>
            </div>
          <% end %>
          <.group_heading>
            Data formats
          </.group_heading>
          <ul class="ml-0 list-none">
            <li>
              <a
                class="mb-1"
                target="_blank"
                href={
                  ~p"/api/json/raw/#{@publication.project_name}/#{@publication.draft_date}/#{@uuid}"
                }
              >
                <span class="text-center inline-block w-[20px]" style="block">{}</span>
                View JSON (raw)
              </a>
            </li>
            <li>
              <a
                class="mb-1"
                target="_blank"
                href={
                  ~p"/api/json/extended/#{@publication.project_name}/#{@publication.draft_date}/#{@uuid}"
                }
              >
                <span class="text-center inline-block w-[20px]" style="block">{}</span>
                View JSON (extended)
              </a>
            </li>
          </ul>
        </div>
      </div>
    </div>
    """
  end
end
