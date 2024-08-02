defmodule FieldPublicationWeb.Presentation.DocumentComponents.Type do
  use Phoenix.Component
  use FieldPublicationWeb, :verified_routes

  alias FieldPublication.Publications.Data.Field
  alias FieldPublication.Publications.Data.FieldGroup
  alias FieldPublication.Publications.Data.Document
  alias FieldPublication.Publications.Data.RelationGroup

  alias FieldPublicationWeb.Presentation.Components.{
    I18n,
    GenericField,
    DocumentLink
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
        <div class="basis-1/5 m-5">
          <%= for %FieldGroup{} = field_group <- @doc.groups do %>
            <% fields_to_display =
              Enum.reject(field_group.fields, fn %Field{name: name} ->
                name in ["identifier", "category", "geometry"]
            end) %>
            <%= unless fields_to_display == [] do %>
              <section>
                <.group_heading>
                  <I18n.text values={field_group.labels} />
                </.group_heading>
                <dl>
                    <%= for %Field{} = field <- fields_to_display do %>
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
              <a download={@doc.identifier} href={~p"/api/image/raw/#{@publication.project_name}/#{@uuid}"}>
                <.icon name="hero-photo-solid" /> Download original
              </a>
            </li>
            <li>
              <a target="_blank" href={~p"/api/raw/csv/#{@publication.project_name}/#{@publication.draft_date}/#{@uuid}"}>
                <.icon name="hero-table-cells-solid" /> Download CSV
              </a>
            </li>
            <li>
              <a target="_blank" href={~p"/api/json/raw/#{@publication.project_name}/#{@publication.draft_date}/#{@uuid}"}>
                <span class="text-center inline-block w-[20px]" style="block">{}</span> Download JSON
              </a>
            </li>
          </ul>
        </div>
        <div class="basis-4/5 m-5">
            <div class="flex flex-row justify-between">
                <%= for %RelationGroup{} = header_group <- @doc.relations
                  |> Enum.filter(fn %RelationGroup{name: name} ->
                      name in ["liesWithin", "contains"] end) do %>
                  <div class="w-[45%] overflow-auto overscroll-contain h-[200px]">
                    <.group_heading>
                      <I18n.text values={header_group.labels} />
                    </.group_heading>
                    <%= for %Document{} = doc <- header_group.docs do %>
                      <DocumentLink.show
                        lang={@lang}
                        doc={doc}
                        image_count={1}
                      />
                    <%= end %>
                  </div>
                <%= end %>
            </div>

          <%= for %RelationGroup{} = relation_group <- @doc.relations
            |> Enum.filter(fn %RelationGroup{name: name} -> name == "hasInstance" end) do %>
            <.group_heading>
                <I18n.text values={relation_group.labels} /> (<%= Enum.count(relation_group.docs) %>)
            </.group_heading>
            <div class="overflow-auto overscroll-contain">
              <%= for %Document{} = doc <- relation_group.docs do %>
                <DocumentLink.show
                  lang={@lang}
                  doc={doc}
                  image_count={1}
                />
              <% end %>
            </div>
          <% end %>
        </div>
      </div>
    </div>
    """
  end
end
