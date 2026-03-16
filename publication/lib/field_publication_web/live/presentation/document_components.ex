defmodule FieldPublicationWeb.Presentation.DocumentComponents do
  alias FieldPublication.DatabaseSchema.Publication
  use FieldPublicationWeb, :html
  use FieldPublicationWeb, :verified_routes

  alias FieldPublicationWeb.Presentation.Components.{
    DocumentAncestors
  }

  import FieldPublicationWeb.Components.Data.{
    DocumentLink,
    Field,
    Image
  }

  alias FieldPublication.DatabaseSchema.Translation
  alias FieldPublication.Publications.Data

  alias FieldPublicationWeb.Components.{
    LanguageSelection,
    ClipboardCopy
  }

  alias FieldPublication.Publications.Data.{
    Document,
    FieldGroup,
    Field,
    RelationGroup
  }

  attr :publication, Publication, required: true
  attr :doc, Document, required: true
  attr :lang, :string, required: true
  attr :focus, :atom, default: :default

  def generic(assigns) do
    ~H"""
    <div class="mb-4">
      <.document_heading>
        <.document_link doc={@doc} />
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
    <div class="flex flex-col lg:flex-row">
      <div class="lg:basis-2/3">
        <%= for %FieldGroup{} = group <- @doc.groups do %>
          <% fields =
            Enum.reject(group.fields, fn %Field{name: name} ->
              name in ["identifier", "category", "geometry"]
            end) %>
          <%= unless fields == [] do %>
            <section>
              <.group_heading>
                {pick_default_translation(group.labels)}
              </.group_heading>

              <dl class="grid max-md:grid-cols-1 md:grid-cols-2 gap-1 mt-2">
                <%= for %Field{} = field <- fields do %>
                  <div class="border p-0.5 border-black/20">
                    <dt class="font-bold">
                      <.render_field_label field={field} />
                    </dt>
                    <dd class="pl-4 pr-4 pb-1">
                      <.render_field_data field={field} />
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
              {pick_default_translation(depicted_in.labels)} ({Enum.count(depicted_in.docs)})
            </.group_heading>
            <div class="p-2 bg-panel overflow-auto overscroll-contain grid grid-cols-3 gap-1 mt-2 max-h-[300px] mb-5">
              <%= for %Document{} = doc <- depicted_in.docs do %>
                <.link navigate={
                  ~p"/projects/#{@publication.project_name}/#{@publication.draft_date}/#{doc.id}"
                }>
                  <div class="max-w-[250px]">
                    <.img_element
                      size="^250,"
                      project={@publication.project_name}
                      uuid={doc.id}
                      alt={"Project image '#{doc.identifier}' (#{pick_default_translation(doc.category.labels)})"}
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
                <span class="text-center inline-block w-5" style="block">{"{}"}</span> View JSON (raw)
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
                <span class="text-center inline-block w-5" style="block">{"{}"}</span>
                View JSON (extended)
              </a>
            </li>
          </ul>
        </section>
      </div>
      <div class="lg:basis-1/3 flex flex-col lg:flex-col-reverse lg:ml-2 lg:justify-end">
        <%= for other_relation <- Enum.reject(
      @doc.relations,
      fn %RelationGroup{name: relation_name} -> relation_name in ["isDepictedIn", "hasDefaultMapLayer", "hasMapLayer"] end
      )  do %>
          <section>
            <.group_heading>
              {pick_default_translation(other_relation.labels)} ({Enum.count(other_relation.docs)})
            </.group_heading>
            <div class="overflow-auto overscroll-contain max-h-[400px]">
              <%= for %Document{geometry: geometry} = doc <- other_relation.docs do %>
                <%= if geometry do %>
                  <div
                    id={"relations_map_highlighter_#{doc.id}"}
                    phx-hook="HoverHighlightMapFeature"
                    target_dom_element="generic_doc_map"
                    target_id={doc.id}
                  >
                    <.document_link
                      doc={doc}
                      image_count={10}
                      geometry_indicator={true}
                    />
                  </div>
                <% else %>
                  <.document_link doc={doc} image_count={10} geometry_indicator={true} />
                <% end %>
              <% end %>
            </div>
          </section>
        <% end %>
        <div class="lg:mb-4">
          <.live_component
            module={FieldPublicationWeb.Presentation.Components.DocumentViewMap}
            id="generic_doc_map"
            style="width:100%; height:500px;"
            doc={@doc}
            ancestors={@ancestors}
            publication={@publication}
          />
        </div>
      </div>
    </div>
    """
  end

  defp generic_map(assigns) do
    ~H"""
    <div class="flex flex-col lg:flex-row">
      <div class="basis-1/3 pr-2">
        <.group_heading>
          Hierarchy
        </.group_heading>
        <div class="overflow-auto overscroll-contain h-(--ol-full-height)">
          <.live_component
            module={DocumentAncestors}
            id={"ancestors-#{@doc.id}"}
            doc={@doc}
            ancestors={@ancestors}
            publication={@publication}
            focus={:map}
            map_id="generic_doc_map_detail"
          />
          <%= for other_relation <- Enum.reject(
          @doc.relations,
          fn %RelationGroup{name: relation_name} -> relation_name in ["isDepictedIn", "hasDefaultMapLayer", "hasMapLayer", "isRecordedIn", "liesWithin", "contains"] end
          )  do %>
            <.group_heading>
              {pick_default_translation(other_relation.labels)} ({Enum.count(other_relation.docs)})
            </.group_heading>
            <div class="overflow-auto overscroll-contain">
              <%= for %Document{geometry: geometry} = doc <- other_relation.docs do %>
                <%= if geometry do %>
                  <div
                    id={"ancester_link_#{doc.id}"}
                    phx-hook="HoverHighlightMapFeature"
                    target_dom_element="generic_doc_map_detail"
                    target_id={doc.id}
                  >
                    <.document_link
                      doc={doc}
                      image_count={10}
                      geometry_indicator={true}
                      focus={:map}
                    />
                  </div>
                <% else %>
                  <div>
                    <.document_link
                      doc={doc}
                      image_count={10}
                      geometry_indicator={true}
                      focus={:map}
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
            style="width:100%; height: var(--ol-full-height);"
            doc={@doc}
            ancestors={@ancestors}
            publication={@publication}
            focus={@focus}
          />
        </div>
      </div>
    </div>
    """
  end

  attr :publication, Publication, required: true
  attr :doc, Document, required: true

  def image(assigns) do
    ~H"""
    <div>
      <.document_heading>
        <.document_link doc={@doc} />
      </.document_heading>

      <div class="flex flex-col-reverse lg:flex-row">
        <div class="basis-full lg:basis-1/3 m-5">
          <%= for %RelationGroup{} = relation_group <- @doc.relations do %>
            <.group_heading>
              {pick_default_translation(relation_group.labels)} ({Enum.count(relation_group.docs)})
            </.group_heading>
            <div class="overflow-auto overscroll-contain max-h-[200px]">
              <%= for %Document{} = doc <- relation_group.docs do %>
                <.document_link doc={doc} image_count={0} />
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
                  {pick_default_translation(group.labels)}
                </.group_heading>

                <dl>
                  <%= for %Field{} = field <- fields do %>
                    <div>
                      <dt class="font-bold">
                        <.render_field_label field={field} />
                      </dt>
                      <dd class="pl-4 pr-4">
                        <.render_field_data field={field} />
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
                <span class="text-center inline-block w-5]" style="block">{"{}"}</span>
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
                <span class="text-center inline-block w-5" style="block">{"{}"}</span>
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
                  copy_value={"#{FieldPublicationWeb.Endpoint.url()}/#{construct_iiif_info_url(@publication.project_name, @doc.id)}"}
                  module={ClipboardCopy}
                >
                  Copy IIIF link
                </.live_component>
              </div>
            </li>
          </ul>
        </div>
        <div class="basis-full lg:basis-2/3 m-5">
          <.iiif_viewer
            class="h-(--ol-full-height) p-2 bg-panel"
            id="iiif_viewer"
            project={@publication.project_name}
            uuid={@doc.id}
          />
        </div>
      </div>
    </div>
    """
  end

  attr :publication, Publication, required: true
  attr :doc, Document, required: true
  attr :lang, :string, required: true
  attr :top_level_docs, :list, required: true

  def project(assigns) do
    ~H"""
    <div>
      <.document_heading>
        <.render_field_data field={Data.get_field(@doc, "shortName")} hide_language_selection?={true} />
      </.document_heading>
      <% depicted_in = Data.get_relation(@doc, "isDepictedIn") %>
      <%= if depicted_in != nil do %>
        <div class="pt-4 pb-4 w-full gap-2 flex flex-row justify-center overflow-x-auto">
          <%= for %Data.Document{} = doc <- depicted_in.docs do %>
            <.link
              patch={~p"/projects/#{@publication.project_name}/#{@publication.draft_date}/#{doc.id}"}
              class="p-2 border border-primary h-[310px]"
            >
              <.img_element
                size="^,300"
                project={@publication.project_name}
                uuid={doc.id}
                alt={doc.identifier}
              />
            </.link>
          <% end %>
        </div>
      <% end %>

      <div class="flex flex-row gap-4">
        <div class="basis-2/3">
          <.group_heading>
            {gettext("project_doc_about_project")}
          </.group_heading>
          <div class="bg-panel p-2">
            <.render_field_data_as_markdown field={Data.get_field(@doc, "description")} />
          </div>
          <.group_heading class="mt-3">
            {gettext("project_doc_about_publication")}
          </.group_heading>
          <div class="bg-panel p-2">
            <.live_component
              :let={comment}
              module={LanguageSelection}
              id="publication_comments"
              translations={
                @publication.comments
                |> Enum.map(fn %Translation{language: lang, text: text} -> {lang, text} end)
                |> Enum.into(%{})
              }
            >
              <span class="markdown">
                {comment
                |> Earmark.as_html!()
                |> Phoenix.HTML.raw()}
              </span>
            </.live_component>
          </div>
        </div>

        <div class="basis-1/3">
          <dl>
            <% institution = Data.get_field(@doc, "institution") %>
            <%= if institution do %>
              <dt class="font-bold"><.render_field_label field={institution} /></dt>
              <.render_field_data field={institution} />
            <% end %>

            <% contact_mail = Data.get_field(@doc, "contactMail") %>
            <% contact_person = Data.get_field(@doc, "contactPerson") %>
            <%= if contact_mail do %>
              <dt class="font-bold">
                <.render_field_label field={contact_person} />
              </dt>
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
              <dt class="font-bold">
                <.render_field_label field={supervisor} />
              </dt>
              <.render_field_data field={supervisor} />
            <% end %>

            <% staff = Data.get_field(@doc, "staff") %>
            <%= if staff do %>
              <dt class="font-bold">
                <.render_field_label field={staff} />
              </dt>
              <dd class="ml-4">{concat_staff_list(staff)}</dd>
            <% end %>

            <% bibliographic_references = Data.get_field(@doc, "bibliographicReferences") %>
            <%= if bibliographic_references do %>
              <dt class="font-bold">
                <.render_field_label field={bibliographic_references} />
              </dt>
              <.render_field_data field={bibliographic_references} />
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
        </div>
      </div>

      <div>
        <.group_heading>
          {gettext("Main documents")}
        </.group_heading>
        <div class="grid grid-cols-4 gap-1">
          <%= for doc <- @top_level_docs do %>
            <.document_link doc={doc} />
          <% end %>
        </div>
      </div>
      <div class="flex flex-row gap-4 mt-4">
        <div class="basis-2/3 flex-none p-2">
          <.live_component
            module={FieldPublicationWeb.Presentation.Components.ProjectViewMap}
            id="project_doc_map"
            style="height: 600px; background-color: var(--panel-color)"
            publication={@publication}
          />
        </div>

        <div class="basis-1/3 h-[600px] overflow-y-scroll">
          <.group_heading>
            {gettext("Documents")}
          </.group_heading>
          <div class="">
            <.display_category_hierarchy
              publication={@publication}
              hierarchy={@category_hierarchy}
              usage={@category_usage}
            />
          </div>
        </div>
      </div>
    </div>
    """
  end

  attr :publication, Publication, required: true
  attr :hierarchy, :map, required: true
  attr :usage, :map, required: true

  defp display_category_hierarchy(assigns) do
    ~H"""
    <%= for {category_name, %{color: color, labels: labels, children: children}} <- @hierarchy do %>
      <% count = @usage[category_name] %>

      <%= if count do %>
        <div
          id={"category_link_#{category_name}"}
          phx-hook="HoverHighlightMapFeature"
          target_dom_element="project_doc_map"
          target_id={"#{Enum.join(get_child_category_names(children) ++ [category_name], ",")}"}
        >
          <.link navigate={
            ~p"/search?#{%{filters: %{category: category_name, project_key: @publication.project_name}}}"
          }>
            <div class="flex flex-row mb-0.5 p-1">
              <span style={"color: #{desaturate_category_color(color)}"}>
                <.icon name="hero-document-solid" />
              </span>
              <div class="pl-1 text-primary hover:text-primary-hover">
                {pick_default_translation(labels)} ({count})
              </div>
            </div>
          </.link>
        </div>
        <div :if={children != %{}} class="pl-4">
          <.display_category_hierarchy publication={@publication} hierarchy={children} usage={@usage} />
        </div>
      <% end %>
    <% end %>
    """
  end

  defp get_child_category_names(branch) do
    Enum.map(branch, fn {key, %{children: children}} ->
      [key] ++ get_child_category_names(children)
    end)
    |> List.flatten()
  end

  defp concat_staff_list(field) do
    case field do
      %{value: value} ->
        Enum.map(value, fn
          val when is_binary(val) ->
            # Value is a list of strings.
            val

          %{"value" => val} when is_binary(val) ->
            # value is a list of maps generated by a checkbox in the UI.
            val

          _ ->
            ["-"]
        end)
        |> Enum.join(", ")

      _ ->
        "-"
    end
  end
end
