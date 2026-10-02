defmodule FieldPublicationWeb.Presentation.Document.Type do
  use FieldPublicationWeb, :live_component

  import FieldPublicationWeb.Components.Data.{
    DocumentLink,
    Field,
    Image
  }

  alias Hex.API.ShortURL

  alias FieldPublication.Publication.{
    Document,
    Field,
    FieldGroup,
    RelationGroup
  }

  def render(assigns) do
    # IO.inspect(assigns)
    ~H"""
    <div class="flex flex-row gap-1">
      <div class="basis-1/3">
        TODO Belongs to Type catalog (link)
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
      </div>

      <div class="basis-2/3">
        <h1>If there are subtypes make a foldable tree or tabs</h1>
        <h1>Else display the finds directly</h1>

        <% associated_finds = Document.get_relation(@doc, "hasInstance") %>
        <%= if associated_finds do %>
          <section>
            <.group_heading>
              {pick_default_translation(associated_finds.labels)} ({Enum.count(associated_finds.docs)})
            </.group_heading>

            <div class="grid grid-cols-3 gap-1 mt-2 mb-5">
              <%= for %Document{} = doc <- associated_finds.docs do %>
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
    """
  end

  def update(
        %{doc: %Document{} = doc, publication: publication},
        socket
      ) do
    todo = "todo "
    # url =  {Data.get_field_value(@doc, "projectURI")}
    # IO.inspect(url)
    {
      :ok,
      socket
      |> assign(:doc, doc)
      |> assign(:todo, todo)
      |> assign(:publication, publication)
      #  |> assign(:url, url)
    }
  end
end
