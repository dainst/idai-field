defmodule FieldPublicationWeb.Presentation.Components.FullProjectMap do
  use FieldPublicationWeb, :live_component

  alias FieldPublication.Publications.Data

  alias FieldPublication.DatabaseSchema.Publication

  alias FieldPublicationWeb.Presentation.Components.DocumentViewMap

  require Logger

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
      project_key={@publication.project_name}
      draft_date={@publication.draft_date}
      language={@language}
      phx-hook="FullProjectMap"
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
        <div class="bg-white">
          <div
            id={"#{@id}-draw-box-selector"}
            phx-click="toggle-draw-box-mode"
            phx-target={@myself}
            class={"w-8 h-8 text-center pt-0.5 rounded #{if @draw_box_mode, do: "bg-primary/20 border border-primary hover:border-primary-hover"}"}
          >
            <.icon name="hero-viewfinder-circle" />
          </div>
        </div>
        <div :if={@project_tile_layers_state != []}>
          <div
            class="right-1 rounded w-8 h-8 text-center pt-0.5 bg-white"
            phx-click={Phoenix.LiveView.JS.toggle(to: "##{@id}-layer-select")}
          >
            <.icon name="hero-square-3-stack-3d" />
          </div>
          <div id={"#{@id}-layer-select"} class="bg-white p-2 pr-8 max-h-64 overflow-auto hidden">
            <DocumentViewMap.render_tile_layer_selection_group
              target={@myself}
              publication={@publication}
              group={:project}
              layer_states={@project_tile_layers_state}
            />
          </div>
        </div>
      </div>
    </div>
    """
  end

  @impl true
  def update(
        %{publication: publication, id: id, preset_geometry: preset_geometry} = assigns,
        socket
      ) do
    assigns = set_defaults(assigns)

    socket =
      push_event(socket, "render-selection-polygon-#{id}", %{geometry: preset_geometry} )
      |> handle_publication_change(publication, id)
      |> assign(assigns)

    {:ok, assign(socket, :no_data, false)}
  end

  @impl true
  def handle_event(
        "visibility-preference",
        %{"group" => "project", "uuid" => uuid, "value" => value},
        socket
      )
      when is_boolean(value) do
    # When a map background layer is loaded on the client side, the client side hook will
    # send this event if the client's localStorage contained a visibility preference for
    # the added layer.
    #
    # The client will have set the layer visibility at this point and uses this event to make
    # sure the server state is the same as in the client's browser.

    layer_states =
      socket.assigns[:project_tile_layers_state]
      |> Enum.map(fn state ->
        if state.uuid == uuid do
          Map.put(state, :visible, value)
        else
          state
        end
      end)

    {
      :noreply,
      assign(socket, :project_tile_layers_state, layer_states)
    }
  end

  def handle_event(
        "toggle-layer",
        %{"group" => "project", "uuid" => uuid},
        %{assigns: %{id: id}} = socket
      ) do
    layer_states =
      socket.assigns[:project_tile_layers_state]
      |> Enum.map(fn state ->
        if state.uuid == uuid do
          Map.put(state, :visible, !state.visible)
        else
          state
        end
      end)

    {
      :noreply,
      socket
      |> assign(:project_tile_layers_state, layer_states)
      |> push_event("full-project-map-set-layer-visibility-#{id}", %{
        uuid: uuid,
        visibility:
          Enum.find(layer_states, fn state -> state.uuid == uuid end) |> Map.get(:visible)
      })
    }
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

  defp handle_publication_change(socket, %Publication{} = current, hook_id) do
    unless Map.has_key?(socket.assigns, :publication) and
             Map.equal?(socket.assigns.publication, current) do
      # If the publication already assigned to the socket differes from the one in the current
      # update call, we re-initialize the background layers. This may occur if the user switches
      # to an older or newer publication of the same project.
      Logger.debug("Resetting project level background layers.")

      project_doc_relations =
        Data.get_raw_document("project", current)
        |> Map.get("resource", %{})
        |> Map.get("relations", %{})

      default_map_layers =
        Map.get(project_doc_relations, "hasDefaultMapLayer", [])
        |> Data.get_raw_documents(current)
        |> Stream.map(&DocumentViewMap.extract_tile_layer_info/1)
        |> Enum.map(fn layer_info ->
          Map.merge(layer_info, %{visible: true})
        end)

      other_map_layers =
        Map.get(project_doc_relations, "hasMapLayer", [])
        |> Data.get_raw_documents(current)
        |> Stream.map(&DocumentViewMap.extract_tile_layer_info/1)
        |> Stream.map(fn layer_info ->
          Map.merge(layer_info, %{visible: false})
        end)
        |> Enum.reject(fn entry ->
          entry.uuid in Map.get(project_doc_relations, "hasDefaultMapLayer", [])
        end)

      socket
      |> push_event("full-project-map-set-layers-#{hook_id}", %{
        project: current.project_name,
        project_tile_layers: default_map_layers ++ other_map_layers
      })
      |> assign(
        :project_tile_layers_state,
        default_map_layers ++ other_map_layers
      )
    else
      # Same publication, leave project layers as they are.
      socket
    end
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
