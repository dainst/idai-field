defmodule FieldPublicationWeb.Presentation.Components.FullProjectMap do
  use FieldPublicationWeb, :live_component

  alias FieldPublication.Publications.Data

  alias FieldPublication.Publications.Data.{
    Category,
    Document
  }

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
      offset_base_element={@offset_base_element}
      project_key={@publication.project_name}
      draft_date={@publication.draft_date}
      phx-hook="FullProjectMap"
    >
      <!-- set phx-update="ignore" to ensure changes the map's DOM elements are not re-rendered on updates
          by live view, but instead the content is controlled by OpenLayers (and/or our hook logic) client side after initializiation. -->
      <div style={@style} id={"#{@id}-map"} phx-update="ignore">
        <div  id={"#{@id}-loading-indicator"} class="text-center p-1 h-full w-full bg-white">
            Loading map...
        </div>
      </div>
      <div :if={@project_tile_layers_state != []} class="absolute p-1 top-1 right-1">
        <div
          class="right-1 absolute rounded w-8 h-8 text-center pt-0.5 bg-white"
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
    """
  end

  def update(
        %{publication: publication, id: id} = assigns,
        socket
      ) do
    assigns = set_defaults(assigns)
    socket = handle_publication_change(socket, publication, id)

    socket = assign(socket, assigns)

    {:ok, assign(socket, :no_data, false)}
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
      |> push_event("full-project-map-set-layer-visibility-#{id}", %{
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
  end

  def create_feature_info(
        %Document{
          category: %Category{color: color, labels: category_labels},
          id: uuid,
          identifier: identifier,
          geometry: geometry
        } = doc,
        hierarchy,
        publication
      ) do
    description =
      doc
      |> Data.get_field_value("shortDescription")
      |> case do
        nil ->
          ""

        value when is_binary(value) ->
          value

        values when is_map(values) ->
          pick_default_translation(values)
      end

    category = pick_default_translation(category_labels)

    base = %{
      type: "Feature",
      properties: %{
        uuid: uuid,
        identifier: identifier,
        color: color,
        description: description,
        category: category,
        parent: next_ancestor_with_geometry(uuid, hierarchy, publication)
      }
    }

    if geometry do
      base
      |> put_in([:geometry], geometry)
      |> put_in([:properties, :type], geometry["type"])
    else
      base
    end
  end

  defp next_ancestor_with_geometry(uuid, hierarchy, publication) do
    Map.get(hierarchy, uuid)
    |> case do
      %{"parent" => nil} ->
        nil

      %{"parent" => parent_uuid} ->
        Data.get_preview_documents([parent_uuid], publication)
    end
    |> case do
      [%Document{id: parent_uuid, geometry: nil}] ->
        next_ancestor_with_geometry(parent_uuid, hierarchy, publication)

      [%Document{id: uuid} = _parent_with_geometry] ->
        uuid

      _ ->
        nil
    end
  end
end
