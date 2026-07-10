defmodule FieldPublicationWeb.Presentation.Document.Project do
  use FieldPublicationWeb, :live_component

  import FieldPublicationWeb.Components.Data.{
    DocumentLink,
    Field,
    Image
  }

  alias FieldPublication.DatabaseSchema.Publication
  alias FieldPublication.DatabaseSchema.Translation
  alias FieldPublication.Publications.Data
  alias FieldPublication.Publications.Search

  alias FieldPublication.Publications.Data.Document

  alias FieldPublicationWeb.Components.LanguageSelection

  def render(assigns) do
    ~H"""
    <div>
      <.document_heading>
        <.render_field_data
          field={Data.get_field(@doc, "shortName")}
          hide_language_selection?={true}
          publication={@publication}
        />
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
            <% description = Data.get_field(@doc, "description") %>
            <%= if description do %>
              <.render_field_data_as_markdown field={description} />
            <% else %>
              -
            <% end %>
          </div>
          <.group_heading class="mt-3">
            {gettext("project_doc_about_publication")}
          </.group_heading>
          <% comments =
            @publication.comments
            |> Enum.map(fn %Translation{language: lang, text: text} -> {lang, text} end)
            |> Enum.into(%{}) %>
          <div class="bg-panel p-2">
            <%= if comments != %{} do %>
              <.live_component
                :let={comment}
                module={LanguageSelection}
                id="publication_comments"
                translations={comments}
              >
                <span class="markdown">
                  {comment
                  |> MDEx.to_html!()
                  |> Phoenix.HTML.raw()}
                </span>
              </.live_component>
            <% else %>
              -
            <% end %>
          </div>
        </div>

        <div class="basis-1/3">
          <% institution = Data.get_field(@doc, "institution") %>
          <%= if institution do %>
            <.labeled_value>
              <:label><.render_field_label field={institution} /></:label>
              <.render_field_data field={institution} publication={@publication} />
            </.labeled_value>
          <% end %>

          <% contact_mail = Data.get_field(@doc, "contactMail") %>
          <% contact_person = Data.get_field(@doc, "contactPerson") %>
          <%= if contact_mail do %>
            <.labeled_value>
              <:label><.render_field_label field={contact_person} /></:label>
              <a href={"mailto:#{contact_mail.value}"}>
                <.icon name="hero-envelope" class="h-6 w-6 mr-1" />
                <%= if contact_person do %>
                  {contact_person.value}
                <% else %>
                  {gettext("contact_email")}
                <% end %>
              </a>
            </.labeled_value>
          <% end %>

          <% supervisor = Data.get_field(@doc, "projectSupervisor") %>
          <%= if supervisor do %>
            <.labeled_value>
              <:label><.render_field_label field={supervisor} /></:label>
              <.render_field_data field={supervisor} publication={@publication} />
            </.labeled_value>
          <% end %>

          <% staff = Data.get_field(@doc, "staff") %>
          <%= if staff do %>
            <.labeled_value>
              <:label><.render_field_label field={staff} /></:label>
              {concat_staff_list(staff)}
            </.labeled_value>
          <% end %>

          <% bibliographic_references = Data.get_field(@doc, "bibliographicReferences") %>
          <%= if bibliographic_references do %>
            <.labeled_value class="max-h-78 overflow-y-auto">
              <:label><.render_field_label field={bibliographic_references} /></:label>
              <.render_field_data field={bibliographic_references} publication={@publication} />
            </.labeled_value>
          <% end %>
          <% url = Data.get_field_value(@doc, "projectURI") %>
          <%= if url do %>
            <.labeled_value>
              <:label>{gettext("further_links")}</:label>
              <a href={url}>
                <.icon name="hero-link" class="h-6 w-6 mr-1" />{gettext("project_home_page")}
              </a>
            </.labeled_value>
          <% end %>
        </div>
      </div>

      <div>
        <.group_heading>
          {gettext("Main documents")}
        </.group_heading>
        <div class="grid grid-cols-4 gap-1 max-h-96 overflow-y-auto">
          <%= for doc <- @top_level_docs do %>
            <.document_link image_count={10} doc={doc} />
          <% end %>
        </div>
      </div>
      <div class="flex flex-row gap-4 mt-4" id="map-offset-element">
        <div class="basis-2/3 flex-none p-2">
          <.live_component
            module={FieldPublicationWeb.Presentation.Components.FullProjectMap}
            id="project_doc_map"
            style="height: 600px; background-color: var(--panel-color)"
            publication={@publication}
            preset_geometry={nil}
          />
        </div>

        <div class="basis-1/3 h-[600px] overflow-y-scroll">
          <.group_heading>
            {gettext("Documents")}
          </.group_heading>
          <div class="">
            <.render_category_hierarchy
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

  defp render_category_hierarchy(assigns) do
    ~H"""
    <%= for {category_name, %{color: color, labels: labels, children: children}} <- @hierarchy do %>
      <% count = @usage[category_name] %>

      <%= if count do %>
        <div
          id={"category_link_#{category_name}"}
          phx-hook="HoverHighlightMapFeature"
          target_dom_element="project_doc_map"
          target_id={"categories-#{Enum.join(get_child_category_names(children) ++ [category_name], ",")}"}
        >
          <.link navigate={
            ~p"/projects/search/#{@publication.project_name}/#{@publication.draft_date}?#{%{filters: %{category: category_name}}}"
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
          <.render_category_hierarchy publication={@publication} hierarchy={children} usage={@usage} />
        </div>
      <% end %>
    <% end %>
    """
  end

  def update(%{doc: %Document{} = doc, publication: %Publication{} = publication}, socket) do
    top_level_docs =
      Data.get_document_hierarchy(publication)
      |> Stream.filter(fn {_uuid, relations} ->
        # All documents that have no parent, but do have children are considered top level.
        Map.get(relations, "parent") == nil && Map.get(relations, "children") != []
      end)
      |> Enum.map(fn {uuid, _values} ->
        uuid
      end)
      |> Data.get_preview_documents(publication)

    category_hierarchy = Data.get_category_hierarchy(publication)
    category_usage = Search.get_category_count(publication)

    {
      :ok,
      socket
      |> assign(:doc, doc)
      |> assign(:publication, publication)
      |> assign(:top_level_docs, top_level_docs)
      |> assign(:category_hierarchy, category_hierarchy)
      |> assign(:category_usage, category_usage)
    }
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

  defp get_child_category_names(branch) do
    Enum.map(branch, fn {key, %{children: children}} ->
      [key] ++ get_child_category_names(children)
    end)
    |> List.flatten()
  end
end
