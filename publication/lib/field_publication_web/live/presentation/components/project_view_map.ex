defmodule FieldPublicationWeb.Presentation.Components.ProjectViewMap do
  use FieldPublicationWeb, :live_component

  alias FieldPublication.Publications.Data
  alias FieldPublication.DatabaseSchema.Publication

  alias FieldPublicationWeb.Presentation.Components.DocumentViewMap

  require Logger

  def render(assigns) do
    ~H"""
    <div
      class="relative"
      id={@id}
      centerLon={@centerLon}
      centerLat={@centerLat}
      zoom={@zoom}
      phx-hook="ProjectViewMap"
    >
      <!-- set phx-update="ignore" to ensure changes the map's DOM elements are not re-rendered on updates
          by live view, but instead the content is controlled by OpenLayers (and/or our hook logic) client side after initializiation. -->
      <div style={@style} id={"#{@id}-map"} phx-update="ignore">
        <!-- Set pointer-events-none, otherwise the tooltip will block click events on the map -->
        <div class="pointer-events-none text-xs" id={"#{@id}-identifier-tooltip"}>
          <div class="border-[1px] rounded-sm border-black flex">
            <div class="saturate-50 pl-2  text-black" id={"#{@id}-identifier-tooltip-category-bar"}>
              <div
                class="h-full bg-white/60 p-1 font-thin"
                id={"#{@id}-identifier-tooltip-category-content"}
              >
              </div>
            </div>
            <div class="grow p-1 h-full bg-white">
              <div class="pointer-events-none" id={"#{@id}-identifier-tooltip-content"}>
                <!-- This div will get repurposed once the map is loaded. -->
                  Loading map...
              </div>
            </div>
          </div>
        </div>
      </div>
      <div :if={@project_tile_layers_state != []} class="absolute p-1 top-1 right-1">
        <div
          class="right-1 absolute rounded w-8 h-8 text-center pt-[2px] bg-white"
          phx-click={Phoenix.LiveView.JS.toggle(to: "##{@id}-layer-select")}
        >
          <.icon name="hero-square-3-stack-3d" />
        </div>
        <div id={"#{@id}-layer-select"} class="bg-white p-2 pr-8 max-h-64 overflow-auto hidden">
          <DocumentViewMap.render_tile_layer_selection_group
            target={@myself}
            lang={@lang}
            publication={@publication}
            group={:project}
            layer_states={@project_tile_layers_state}
          />
        </div>
      </div>
      <div
        :if={@no_data}
        class="absolute w-full h-full top-0 bg-white text-center place-content-center"
      >
        <.icon class="mb-1" name="hero-no-symbol" /> No geometry context available
      </div>
    </div>
    """
  end

  def update(
        %{publication: publication, id: id} = assigns,
        socket
      ) do
    assigns = set_defaults(assigns)
    socket = handle_publication_change(socket, publication, id)

    category_geometries = Data.get_geometries_by_category(publication)

    feature_collections =
      category_geometries
      |> Enum.map(fn {category_key, %{color: color, geometries: geometries}} ->
        %{
          type: "FeatureCollection",
          features:
            Enum.map(geometries, fn geometry ->
              %{
                type: "Feature",
                geometry: geometry,
                properties: %{
                  color: color,
                  group: category_key,
                  type: geometry["type"]
                }
              }
            end)
        }
      end)

    socket = assign(socket, assigns)

    socket =
      if feature_collections == [] do
        socket
      else
        socket
        |> push_event("project-map-update-#{id}", %{
          feature_collections: feature_collections
        })
        |> assign(:no_data, false)
      end

    {:ok, socket}
  end

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
      |> push_event("project-map-set-layer-visibility-#{id}", %{
        uuid: uuid,
        visibility:
          Enum.find(layer_states, fn state -> state.uuid == uuid end) |> Map.get(:visible)
      })
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
      |> push_event("project-map-set-layers-#{hook_id}", %{
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
    |> Map.put(:no_data, true)
  end
end
