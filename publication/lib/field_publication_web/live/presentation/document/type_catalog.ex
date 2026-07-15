defmodule FieldPublicationWeb.Presentation.Document.TypeCatalog do
  use FieldPublicationWeb, :live_component

  import FieldPublicationWeb.Components.Data.{
    DocumentLink
  }

  alias FieldPublication.Publications.Data.{
    Document,
    RelationGroup
  }

  def render(assigns) do
    ~H"""
    <div class="p-1 bg-panel">
      <form class="p-2">
        <div class="inline-block">
          <div class="flex border border-black/20">
            <input class="hero-magnifying-glass text-gray-400" />
            <input
              phx-change="filter_identifier"
              value={@filter}
              phx-target={@myself}
              name="identifier-filter"
              type="text"
              placeholder="Search in type catalog"
            />
          </div>
          <div
            class="text-gray-700"
            phx-click="toggle_sort"
            phx-target={@myself}
          >
            Showing {Enum.count(@type_list)} of {@total_type_number} types
            <a
              phx-click="toggle_sort"
              phx-target={@myself}
              class={"w-0 h-0
                  border-l-[6px]
                  border-r-[6px]
                  border-l-transparent
                  border-r-transparent
                  inline-block
                  #{if @sort_order == :asc, do: '
                    border-b-[12px]
                    border-b-gray-500
                    ',
                  else: '
                    border-t-[12px]
                    border-t-gray-500
                    '}
                      "}
            >
            </a>
          </div>
        </div>
      </form>
      <section class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-1 overflow-y-auto max-h-[200vh]">
        <%= for %Document{geometry: geometry} = doc <- @type_list do %>
          <.document_link
            doc={doc}
            image_count={10}
          />
        <% end %>
      </section>
    </div>
    """
  end

  def update(
        %{doc: %Document{} = doc, publication: publication} = _assigns,
        socket
      ) do
    initial_order = :asc

    type_list = get_full_list(doc, initial_order)

    {
      :ok,
      socket
      |> assign(:doc, doc)
      |> assign(:sort_order, initial_order)
      |> assign(:filter, nil)
      |> assign(:type_list, type_list)
      |> assign(:publication, publication)
      |> assign(:total_type_number, Enum.count(type_list))
    }
  end

  def handle_event(
        "toggle_sort",
        _parameters,
        %{assigns: %{type_list: type_list, sort_order: sort_order}} = socket
      ) do
    new_sort =
      if sort_order == :asc do
        :desc
      else
        :asc
      end

    sorted_list =
      sort_type_list(type_list, sort_order)

    {
      :noreply,
      socket
      |> assign(:sort_order, new_sort)
      |> assign(:type_list, sorted_list)
    }
  end

  def handle_event("filter_identifier", %{"identifier-filter" => filter_parameter}, socket) do
    {
      :noreply,
      socket
      |> assign(:filter, String.downcase(filter_parameter))
      |> apply_filter()
    }
  end

  defp apply_filter(%{assigns: %{filter: filter, doc: doc, sort_order: sort_order}} = socket) do
    type_list = get_full_list(doc, sort_order)

    filtered_list =
      Enum.filter(type_list, fn doc ->
        doc.identifier
        |> String.downcase()
        |> String.contains?(filter)
      end)

    socket
    |> assign(:type_list, filtered_list)
  end

  defp get_full_list(%Document{relations: relations}, sort_order) do
    type_list =
      Enum.filter(
        relations,
        fn %RelationGroup{
             name: relation_name
           } ->
          relation_name in ["contains"]
        end
      )
      |> List.first()
      |> Map.get(:docs, [])
      |> sort_type_list(sort_order)
  end

  defp sort_type_list(type_list, sort_order) do
    type_list
    |> Enum.sort(fn doc_a, doc_b ->
      if sort_order == :asc do
        doc_a.identifier < doc_b.identifier
      else
        doc_a.identifier > doc_b.identifier
      end
    end)
  end
end
