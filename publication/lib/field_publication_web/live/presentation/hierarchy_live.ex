defmodule FieldPublicationWeb.Presentation.HierarchyLive do
  alias FieldPublication.Publications
  alias FieldPublication.Publications.Data
  use FieldPublicationWeb, :live_view

  alias FieldPublicationWeb.Presentation.Components.{
    DocumentLink,
    ViewSelection,
    PublicationSelection,
    GenericField
  }

  alias FieldPublication.Projects

  import FieldPublicationWeb.Presentation.Components.Typography

  def render(assigns) do
    ~H"""
    <div>
      <PublicationSelection.render
        publications={@publications}
        current_publication={@publication}
        uuid={@uuid}
        selected_lang={@lang}
        identifier={
          if Data.get_field_values(@current_doc, "category") != "Project",
            do: Data.get_field_values(@current_doc, "identifier")
        }
      />
    </div>
    <.document_heading>
      <DocumentLink.show project={@project_name} date={@draft_date} lang={@lang} doc={@current_doc} />
    </.document_heading>

    <ViewSelection.render
      project={@project_name}
      date={@draft_date}
      lang={@lang}
      uuid={@uuid}
      current={:hierarchy}
    />
    <% description = Data.get_field(@current_doc, "description") %>
    <%= if description do %>
      <GenericField.render field={description} lang={@lang} />
    <% end %>

    <div class="grid grid-cols-3 gap-2 justify-center">
      <div>
        <.group_heading>Level above</.group_heading>
        <div class="max-h-[50vh] overflow-auto">
          <%= for doc <- @level_above do %>
            <DocumentLink.hierarchy
              project={@project_name}
              date={@draft_date}
              lang={@lang}
              doc={doc}
              is_highlighted={doc["id"] == @parent_uuid}
            />
          <% end %>

          <%= if @level_above == [] do %>
            No documents.
          <% end %>
        </div>
      </div>
      <div>
        <.group_heading>Same level</.group_heading>
        <div class="max-h-[50vh] overflow-auto">
          <%= for sibling_or_self <- @same_level do %>
            <DocumentLink.hierarchy
              project={@project_name}
              date={@draft_date}
              lang={@lang}
              doc={sibling_or_self}
              is_highlighted={sibling_or_self["id"] == @uuid}
            />
          <% end %>

          <%= if @same_level == [] do %>
            No documents.
          <% end %>
        </div>
      </div>
      <div>
        <.group_heading>Level below</.group_heading>
        <div class="max-h-[50vh] overflow-auto">
          <%= for child <- @level_below do %>
            <div>
              <DocumentLink.hierarchy
                project={@project_name}
                date={@draft_date}
                lang={@lang}
                doc={child}
              />
            </div>
          <% end %>

          <%= if @level_below == [] do %>
            No documents.
          <% end %>
        </div>
      </div>
    </div>
    """
  end

  def mount(
        %{"project_id" => project_name},
        _session,
        socket
      ) do
    publications =
      project_name
      |> Publications.list()
      |> Enum.filter(fn pub ->
        Projects.has_publication_access?(pub, socket.assigns.current_user)
      end)

    {
      :ok,
      socket
      |> assign(:publications, publications)
    }
  end

  def handle_params(
        %{
          "language" => lang,
          "project_id" => project_name,
          "draft_date" => date,
          "uuid" => uuid
        },
        _uri,
        socket
      ) do
    publication = Publications.get!(project_name, date)

    hierarchy = Data.get_hierarchy(publication)

    [current_doc] = Data.get_documents([uuid], publication)

    parent_uuid = hierarchy[uuid]["parent"]

    level_above =
      if parent_uuid != nil do
        parent_hierarchy_entry = hierarchy[parent_uuid]

        if parent_hierarchy_entry["parent"] != nil do
          Data.get_documents(
            hierarchy[parent_hierarchy_entry["parent"]]["children"],
            publication
          )
        else
          top_level_uuids =
            hierarchy
            |> Enum.filter(fn {_key, values} ->
              Map.get(values, "parent") == nil
            end)
            |> Enum.map(fn {key, _values} ->
              key
            end)

          Data.get_documents(top_level_uuids, publication)
        end
      else
        []
      end

    same_level =
      if parent_uuid != nil do
        Data.get_documents(hierarchy[parent_uuid]["children"], publication)
      else
        top_level_uuids =
          hierarchy
          |> Enum.filter(fn {_key, values} ->
            Map.get(values, "parent") == nil
          end)
          |> Enum.map(fn {key, _values} ->
            key
          end)

        Data.get_documents(top_level_uuids, publication)
      end

    level_below = Data.get_documents(hierarchy[uuid]["children"], publication)

    {
      :noreply,
      socket
      |> assign(:lang, lang)
      |> assign(:publication, publication)
      |> assign(:project_name, project_name)
      |> assign(:draft_date, date)
      |> assign(:uuid, uuid)
      |> assign(:current_doc, current_doc)
      |> assign(:parent_uuid, parent_uuid)
      |> assign(:level_above, level_above)
      |> assign(:same_level, same_level)
      |> assign(:level_below, level_below)
    }
  end
end
