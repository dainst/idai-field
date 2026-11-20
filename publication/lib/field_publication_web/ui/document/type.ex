defmodule FieldPublicationWeb.Presentation.Document.Type do
  use FieldPublicationWeb, :live_component

  import FieldPublicationWeb.UI.Components.Data.{
    DocumentLink,
    Field,
    Image
  }

  alias FieldPublication.Publication.{
    Document,
    Field,
    FieldGroup,
    RelationGroup,
    Geo
  }

  alias FieldPublicationWeb.UI.Components.DocumentMap

  def render(assigns) do
    ~H"""
    <div class="flex flex-row gap-1">
      <div class="basis-1/3">
        <%= for %FieldGroup{} = group <- @doc.groups do %>
          <% fields =
            Enum.reject(group.fields, fn %Field{name: name} ->
              name in ["identifier", "category", "geometry"]
            end)
            |> Enum.sort_by(fn %Field{input_type: type} ->
              !(type in ["text"])
            end) %>
          <%= unless fields |> Enum.reject(fn field -> field.name == "shortDescription" end) == [] do %>
            <section>
              <.group_heading>
                {pick_default_translation(group.labels)}
              </.group_heading>

              <div class="grid max-md:grid-cols-1 md:grid-cols-2 gap-1 mt-2">
                <%= for %Field{input_type: type } = field <- fields do %>
                  <div class={"#{if type in ["text"], do: "col-span-2"}"}>
                    <.render_field field={field} publication={@publication} />
                  </div>
                <% end %>
              </div>
            </section>
          <% end %>
        <% end %>
        <% depicted_in = Document.get_relation(@doc, "isDepictedIn") %>
        <%= if depicted_in do %>
          <section>
            <.group_heading>
              {pick_default_translation(depicted_in.labels)} ({Enum.count(depicted_in.docs)})
            </.group_heading>
            <div class="flex flex-wrap gap-1 mt-2 mb-5">
              <%= for %Document{} = doc <- depicted_in.docs do %>
                <.link navigate={
                  ~p"/projects/#{@publication.project_identifier}/#{@publication.draft_date}/#{doc.id}"
                }>
                  <.img_element
                    class="border-1 h-full border-primary hover:border-primary-hover object-contain p-2 bg-panel"
                    size="^!250,250"
                    project={@publication.project_identifier}
                    uuid={doc.id}
                    alt={"Project image '#{doc.identifier}' (#{pick_default_translation(doc.category.labels)})"}
                  />
                </.link>
              <% end %>
            </div>
          </section>
        <% end %>

        <div class="grid grid-cols-2 gap-1 mt-2 mb-5">
          <% parent_type = Document.get_relation(@doc, "liesWithin") %>
          <%= if parent_type do %>
            <section>
              <.group_heading>
                {pick_default_translation(parent_type.labels)}
              </.group_heading>
              <div class="grid grid-cols-1 gap-1 mt-2 mb-5">
                <%= for %Document{} = doc <- parent_type.docs do %>
                  <.document_link
                    id={doc.id}
                    doc={doc}
                    image_count={10}
                    image_height={200}
                  />
                <% end %>
              </div>
            </section>
          <% end %>
        </div>
      </div>

      <div class="gap-4 basis-2/3">
        <% associated_finds = Document.get_relation(@doc, "hasInstance") %>
        <% total_associated_finds =
          Enum.count(FieldPublication.Publication.get_all_associated_finds(@doc.id, @publication)) %>
        <% directly_associated_finds_number = 0 %>
        <%= if associated_finds do %>
          <% directly_associated_finds_number = Enum.count(associated_finds.docs) %>
          <section>
            <.group_heading>
              Directly associated finds {# pick_default_translation(associated_finds.labels)} ({directly_associated_finds_number}/{total_associated_finds})
            </.group_heading>
            <div class="grid grid-cols-3 gap-1 mt-2 mb-5">
                <.grouped_document_links
                  docs={associated_finds.docs}
                  image_count={10}
                  image_height={200}
                  geometry_indicator={true}
                  hover_target="associated_finds_map"
                />
            </div>
          </section>
        <% end %>

        <div class="grid grid-cols-2 gap-1 mt-2 mb-5">
          <% children_types = Document.get_relation(@doc, "contains") %>
          <%= if children_types do %>
            <section>
              <.group_heading>
                Associated finds in nested types ({total_associated_finds -
                  FieldPublication.Publication.count_directly_associated_finds(@doc)}/{total_associated_finds})
              </.group_heading>
              <div class="grid grid-cols-1 gap-1 mt-2 mb-5">
                <%= for %Document{} = doc <- children_types.docs do %>
                  <% childrens_accumulated_finds =
                    FieldPublication.Publication.get_all_associated_finds(doc.id, @publication) %>
                  <.document_link
                    id={doc.id}
                    doc={doc}
                    image_count={10}
                    image_height={20}
                  />
                  <div class="ml-4">
                    <.grouped_document_links
                      docs={childrens_accumulated_finds}
                      image_count={10}
                      image_height={50}
                      geometry_indicator={true}
                      hover_target="associated_finds_map"
                    />
                  </div>
                <% end %>
              </div>
            </section>
          <% end %>
        </div>
      </div>
      <div  class="basis-1/3">
          <.live_component
            module={FieldPublicationWeb.UI.Components.DocumentMap}
            id="associated_finds_map"
            style="width:100%; height:500px;"
            doc={@all_associated_finds_doc}
            publication={@publication}
          />
      </div>
    </div>
    """
  end

  def update(
        %{doc: %Document{} = doc, publication: publication},
        socket
      ) do
    # url =  {Data.get_field_value(@doc, "projectURI")}

    # retrieve directly associated finds
    associated_finds = Document.get_relation(doc, "hasInstance")
    directly_associated_docs = if associated_finds, do: associated_finds.docs, else: []

    # retrieve associated finds in nested types
    childrens_accumulated_finds =
      FieldPublication.Publication.get_all_associated_finds(doc.id, publication)

    # combines all associateds finds and generate a document
    all_associated_docs = directly_associated_docs ++ childrens_accumulated_finds
    |> Enum.uniq_by(& &1.id)

    all_associated_finds_doc = %Document{
      id: "all_associated_finds_to_a_type_temporary_document",
      identifier: "Map: #{doc.identifier}",
      category: nil,
      relations: [
        %RelationGroup{
          name: "all_associated_finds",
          docs: all_associated_docs,
          labels: nil
        }
      ],
      project_identifier: publication.project_identifier,
      publication_draft_date: publication.draft_date
    }

    {
      :ok,
      socket
      |> assign(:doc, doc)
      |> assign(:publication, publication)
      |> assign(:all_associated_finds_doc, all_associated_finds_doc)
      #  |> assign(:url, url)
    }
  end
end
