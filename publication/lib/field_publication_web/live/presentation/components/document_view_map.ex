defmodule FieldPublicationWeb.Presentation.Components.DocumentViewMap do
  use FieldPublicationWeb, :live_component

  alias FieldPublication.DatabaseSchema.Publication

  alias FieldPublication.Publications.Data.{
    RelationGroup,
    Document
  }

  def render(assigns) do
    ~H"""
    <div>
      <.group_heading>
        Geometry <span class="text-xs">({@document_geometry_type})</span>
        <.link patch={
          ~p"/projects/#{@publication.project_name}/#{@publication.draft_date}/#{@uuid}?#{if @focus != :map, do: %{focus: "map"}, else: %{}}"
        }>
          <.icon name={
            if @focus != :map, do: "hero-arrows-pointing-out", else: "hero-arrows-pointing-in"
          } />
        </.link>
      </.group_heading>
      <div
        class="relative bg-panel"
        id={@id}
        centerLon={@centerLon}
        centerLat={@centerLat}
        zoom={@zoom}
        language={@language}
        project_key={@publication.project_name}
        draft_date={@publication.draft_date}
        phx-hook="DocumentViewMap"
        initial_uuid={@uuid}
        initial_linked={@linked_uuids |> Enum.join("|")}
      >
        <!-- set phx-update="ignore" to ensure changes the map's DOM elements are not re-rendered on updates
          by live view, but instead the content is controlled by OpenLayers (and/or our hook logic) client side after initializiation. -->
        <div style={@style} id={"#{@id}-map"} phx-update="ignore">
          <div id={"#{@id}-loading-indicator"} class="text-center p-1 h-full w-full bg-white">
            Loading map...
          </div>

          <div class="text-xs" id={"#{@id}-identifier-tooltip"}>
            <div class="grow h-full" id={"#{@id}-identifier-tooltip-content"}></div>
          </div>
        </div>
        <div class="absolute p-1 top-1 right-1 flex gap-1">
          <div class="bg-white rounded">
            <div
              id={"#{@id}-draw-box-selector"}
              phx-click="toggle-draw-box-mode"
              phx-target={@myself}
              class={"w-8 h-8 text-center pt-0.5 rounded #{if @draw_box_mode, do: "bg-primary/20 border border-primary hover:border-primary-hover"}"}
            >
              <.icon name="hero-pencil-square" />
            </div>
          </div>
          <.live_component
            module={FieldPublicationWeb.Components.Map.TileLayerSelection}
            id={"#{@id}-tile-layer-selection"}
            map_id={@id}
            doc={@doc}
            publication={@publication}
          />
        </div>
        <div
          :if={@no_data}
          class="absolute w-full h-full top-0 bg-white text-center place-content-center"
        >
          <.icon class="mb-1" name="hero-no-symbol" /> No geometry context available
        </div>
      </div>
    </div>
    """
  end

  def update(
        %{
          id: id,
          publication: %Publication{} = _publication,
          doc:
            %Document{
              relations: relations,
              geometry: geometry
            } = doc
        } =
          assigns,
        socket
      ) do
    # hierarchy = Data.get_document_hierarchy(publication)

    directly_linked_uuids =
      Enum.map(relations, fn %RelationGroup{docs: docs} ->
        Enum.map(docs, fn %Document{id: id} -> id end)
      end)
      |> List.flatten()
      |> Enum.uniq()

    socket = assign(socket, set_defaults(assigns))

    socket =
      case Map.get(socket.assigns, :uuid) do
        value when value != doc.id ->
          push_event(socket, "document-map-update-#{id}", %{
            uuid: doc.id,
            linked_uuids: directly_linked_uuids
          })

        _same_uuid_or_just_initialized ->
          socket
      end

    {
      :ok,
      socket
      |> assign(:no_data, false)
      |> assign(:uuid, doc.id)
      |> assign(:linked_uuids, directly_linked_uuids)
      |> assign(:document_geometry_type, geometry["type"] || "None")
      |> assign(:doc, doc)
    }
  end

  defp set_defaults(assigns) do
    assigns
    |> Map.put_new(:centerLon, 0)
    |> Map.put_new(:centerLat, 0)
    |> Map.put_new(:zoom, 2)
    |> Map.put_new(:draw_box_mode, false)
    |> Map.put_new(:language, Gettext.get_locale(FieldPublicationWeb.Translate))
    |> Map.put_new(:focus, :default)
  end

  def handle_event("toggle-draw-box-mode", _, socket) do
    {
      :noreply,
      toggle_draw_mode(socket)
    }
  end

  def handle_event("drawn-selection", %{"coordinates" => multipolygon_coordinates}, socket) do
    case multipolygon_coordinates do
      [polygon_coordinates] when is_list(polygon_coordinates) ->
        Enum.all?(polygon_coordinates, fn
          [a, b] when is_float(a) and is_float(b) -> true
          _ -> false
        end)

      _ ->
        false
    end
    |> if do
      # Sends notification to whatever live view is using this map component.
      send(self(), {:drawn_selection, List.first(multipolygon_coordinates)})
    end

    {
      :noreply,
      toggle_draw_mode(socket)
    }
  end

  defp toggle_draw_mode(%{assigns: %{id: id, draw_box_mode: current}} = socket) do
    new_value = !current

    socket
    |> assign(:draw_box_mode, new_value)
    |> push_event("set-draw-box-mode-#{id}", %{new_value: new_value})
  end
end
