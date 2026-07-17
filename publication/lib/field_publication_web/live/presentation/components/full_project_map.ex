defmodule FieldPublicationWeb.Presentation.Components.FullProjectMap do
  use FieldPublicationWeb, :live_component

  @impl true
  def render(assigns) do
    ~H"""
    <div
      class="relative"
      id={@id}
      centerLon={@centerLon}
      centerLat={@centerLat}
      zoom={@zoom}
      offset_base_element={@offset_base_element}
      project_identifier={@publication.project_identifier}
      draft_date={@publication.draft_date}
      language={@language}
      phx-hook="FullProjectMap"
    >
      <!-- set phx-update="ignore" to ensure changes the map's DOM elements are not re-rendered on updates
          by live view, but instead the content is controlled by OpenLayers (and/or our hook logic) client side after initializiation. -->
      <div style={@style} id={"#{@id}-map"} phx-update="ignore">
        <div
          id={"#{@id}-loading-indicator"}
          class="text-center z-20 absolute p-1 h-full w-full bg-white"
        >
          Loading map...
        </div>
        <div class="text-xs" id={"#{@id}-identifier-tooltip"}>
          <div class="grow h-full" id={"#{@id}-identifier-tooltip-content"}></div>
        </div>
      </div>
      <div class="absolute p-1 top-1 right-1 flex gap-1">
        <div class="bg-white">
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
          publication={@publication}
        />
      </div>
    </div>
    """
  end

  @impl true
  def update(
        %{id: id, preset_geometry: preset_geometry} = assigns,
        socket
      ) do
    assigns = set_defaults(assigns)

    {
      :ok,
      socket
      |> assign(assigns)
      |> push_event("render-selection-polygon-#{id}", %{geometry: preset_geometry})
    }
  end

  @impl true
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

  defp set_defaults(assigns) do
    assigns
    |> Map.put_new(:centerLon, 0)
    |> Map.put_new(:centerLat, 0)
    |> Map.put_new(:zoom, 2)
    |> Map.put_new(:offset_base_element, nil)
    |> Map.put_new(:language, Gettext.get_locale(FieldPublicationWeb.Translate))
    |> Map.put_new(:draw_box_mode, false)
  end

  defp toggle_draw_mode(%{assigns: %{id: id, draw_box_mode: current}} = socket) do
    new_value = !current

    socket
    |> assign(:draw_box_mode, new_value)
    |> push_event("set-draw-box-mode-#{id}", %{new_value: new_value})
  end
end
