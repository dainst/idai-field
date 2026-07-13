defmodule FieldPublicationWeb.Presentation.Document.GenericMap do
  use FieldPublicationWeb, :live_component

  import FieldPublicationWeb.Components.Data.{
    DocumentLink,
    Field,
    Image
  }

  alias FieldPublication.DatabaseSchema.Publication
  alias FieldPublication.Publications.Data

  alias FieldPublication.Publications.Data.{
    Document,
    Field,
    FieldGroup,
    RelationGroup
  }

  def render(assigns) do
    ~H"""
    <div class="flex flex-col lg:flex-row">
      <div class="basis-1/3 pr-2 ">
        <div class="flex gap-1 w-full text-center pb-1">
          <.link
            patch={
              ~p"/projects/#{@publication.project_name}/#{@publication.draft_date}/#{@doc.id}/map"
            }
            class={"p-2 basis-1/3 hover:bg-primary/5 #{if @live_action == :map_datasheet, do: "border"}"}
          >
            Data
          </.link>
          <.link
            patch={
              ~p"/projects/#{@publication.project_name}/#{@publication.draft_date}/#{@doc.id}/map/hierarchy"
            }
            class={"p-2 basis-1/3 hover:bg-primary/5 #{if @live_action == :map_hierarchy, do: "border"}"}
          >
            Hierarchy
          </.link>
          <.link
            :if={!Enum.empty?(@context)}
            patch={
              ~p"/projects/#{@publication.project_name}/#{@publication.draft_date}/#{@doc.id}/map/context"
            }
            class={"p-2 basis-1/3 hover:bg-primary/5 #{if @live_action == :map_context, do: "border"}"}
          >
            Context
          </.link>
          <div :if={Enum.empty?(@context)} class="p-2 basis-1/3 line-through">Context</div>

          <.link
            class="p-2"
            patch={~p"/projects/#{@publication.project_name}/#{@publication.draft_date}/#{@doc.id}"}
          >
            <.icon name="hero-arrows-pointing-in" />
          </.link>
        </div>

        <div class="p-2 overflow-auto max-h-(--ol-full-height)">
          {render_action(@live_action, assigns)}
        </div>
      </div>

      <div class="basis-2/3">
        <.live_component
          module={FieldPublicationWeb.Presentation.Components.DocumentViewMap}
          id="generic_doc_map_detail"
          style="width:100%; height: var(--ol-full-height);"
          doc={@doc}
          publication={@publication}
          explicit_uuids={@relevant_uuids}
        />
      </div>
    </div>
    """
  end

  defp render_action(:map_datasheet, assigns) do
    ~H"""
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

          <div class="grid grid-cols-1 gap-1 mt-2">
            <%= for %Field{} = field <- fields do %>
              <.labeled_value class="border p-0.5 border-black/20">
                <:label><.render_field_label field={field} /></:label>
                <.render_field_data field={field} publication={@publication} />
              </.labeled_value>
            <% end %>
          </div>
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
    """
  end

  defp render_action(:map_hierarchy, assigns) do
    ~H"""
    <div class="flex flex-col gap-1">
      <%= for ancestor_doc <- @hierarchy.ancestors do %>
        <.document_link
          id={"ancestor-#{ancestor_doc.id}"}
          doc={ancestor_doc}
          image_count={10}
          geometry_indicator={true}
          hover_target="generic_doc_map_detail"
          live_action={:map_hierarchy}
        />
        <div class="justify-self-center text-center">
          <.icon name="hero-chevron-double-up" />
        </div>
      <% end %>

      <div class="border-2 border-primary bg-primary/50 p-2" }>
        <.document_link
          id={"self-#{@doc.id}"}
          doc={@doc}
          image_count={0}
          geometry_indicator={true}
          hover_target="generic_doc_map_detail"
          live_action={:map_hierarchy}
        />
      </div>
      <%= if !Enum.empty?(@hierarchy.siblings) do %>
        <div class="justify-self-center text-center">
          <.icon name="hero-pause" />
        </div>
      <% end %>
      <%= for doc <- @hierarchy.siblings do %>
        <.document_link
          id={"self-#{doc.id}"}
          doc={doc}
          image_count={10}
          geometry_indicator={true}
          hover_target="generic_doc_map_detail"
          live_action={:map_hierarchy}
        />
      <% end %>
      <div :if={@hierarchy.children != []} class="justify-self-center text-center">
        <.icon name="hero-chevron-double-down" />
      </div>
      <%= for doc <- @hierarchy.children do %>
        <.document_link
          id={"child-#{doc.id}"}
          doc={doc}
          image_count={10}
          geometry_indicator={true}
          hover_target="generic_doc_map_detail"
          live_action={:map_hierarchy}
        />
      <% end %>
    </div>
    """
  end

  defp render_action(:map_context, assigns) do
    ~H"""
    <%= for %{labels: labels, name: name, docs: related_docs} <- @context  do %>
      <section>
        <.group_heading>
          {pick_default_translation(labels)} ({Enum.count(related_docs)})
        </.group_heading>
        <%= for doc <- related_docs do %>
          <.document_link
            id={"#{name}-#{doc.id}"}
            doc={doc}
            image_count={10}
            geometry_indicator={true}
            hover_target="generic_doc_map"
            live_action={:map_context}
          />
        <% end %>
      </section>
    <% end %>
    """
  end

  def update(
        %{
          doc: %Document{} = doc,
          publication: %Publication{} = publication,
          live_action: live_action
        },
        socket
      ) do
    context =
      Enum.reject(
        doc.relations,
        fn %RelationGroup{name: relation_name} ->
          relation_name in [
            "isDepictedIn",
            "hasDefaultMapLayer",
            "hasMapLayer",
            "contains",
            "liesWithin",
            "isRecordedIn"
          ]
        end
      )

    {hierarchy, uuids} = construct_hierarchy(publication, doc)

    {
      :ok,
      socket
      |> assign(:doc, doc)
      |> assign(:context, context)
      |> assign(:hierarchy, hierarchy)
      |> assign(:publication, publication)
      |> assign(:relevant_uuids, uuids)
      |> assign(:live_action, live_action)
    }
  end

  defp construct_hierarchy(publication, %{id: uuid}) do
    hierarchy = Data.get_document_hierarchy(publication)

    %{"children" => children_uuids, "parent" => parent_uuid} = Map.get(hierarchy, uuid)

    ancestor_uuids = accumulate_ancestors(parent_uuid, hierarchy)

    sibling_uuids =
      Map.get(hierarchy, parent_uuid)
      |> case do
        nil ->
          []

        %{"children" => sibling_uuids} ->
          sibling_uuids
          |> Enum.reject(fn val -> val == uuid end)
          |> Enum.sort()
      end

    {
      %{
        children: Data.get_preview_documents(children_uuids, publication),
        siblings: Data.get_preview_documents(sibling_uuids, publication),
        ancestors: Data.get_preview_documents(ancestor_uuids, publication)
      },
      children_uuids ++ sibling_uuids ++ ancestor_uuids ++ [uuid]
    }
  end

  defp accumulate_ancestors(nil, _) do
    []
  end

  defp accumulate_ancestors(uuid, hierarchy) do
    %{"parent" => parent_uuid} = Map.get(hierarchy, uuid)
    accumulate_ancestors(parent_uuid, hierarchy) ++ [uuid]
  end
end
