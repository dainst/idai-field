defmodule FieldPublicationWeb.Presentation.Components.DocumentViewMap do
  use FieldPublicationWeb, :live_component

  require Logger

  alias FieldPublication.DatabaseSchema.Publication
  alias FieldPublication.Publications.Data

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
        phx-hook="DocumentViewMap"
      >
        <!-- set phx-update="ignore" to ensure changes the map's DOM elements are not re-rendered on updates
          by live view, but instead the content is controlled by OpenLayers (and/or our hook logic) client side after initializiation. -->
        <div style={@style} id={"#{@id}-map"} phx-update="ignore">
          <div class="text-xs" id={"#{@id}-identifier-tooltip"}>
            <div class="grow h-full" id={"#{@id}-identifier-tooltip-content"}>
              <!-- This div will get repurposed once the map is loaded. -->
                Loading map...
            </div>
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
          <div :if={@document_tile_layers_state ++ @project_tile_layers_state != []}>
            <div
              class="right-1 rounded w-8 h-8 text-center pt-0.5 bg-white"
              phx-click={Phoenix.LiveView.JS.toggle(to: "##{@id}-layer-select")}
            >
              <.icon name="hero-square-3-stack-3d" />
            </div>
            <div id={"#{@id}-layer-select"} class="bg-white p-2 pr-8 max-h-64 overflow-auto hidden">
              <.render_tile_layer_selection_group
                target={@myself}
                publication={@publication}
                group={:document}
                layer_states={@document_tile_layers_state}
              />
              <.render_tile_layer_selection_group
                target={@myself}
                publication={@publication}
                group={:project}
                layer_states={@project_tile_layers_state}
              />
            </div>
          </div>
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
          publication: %Publication{} = publication,
          doc: %Document{} = doc,
          ancestors: _ancestors
        } =
          assigns,
        socket
      ) do
    assigns = set_defaults(assigns)

    socket = handle_publication_change(socket, publication, id)
    socket = process_document_tile_layers(socket, publication, doc, id)

    hierarchy = Data.get_document_hierarchy(publication)

    children_features =
      doc
      |> get_docs_in_relation(["contains", "isAbove", "cuts", "isCutBy"])
      |> Data.get_map_feature_collection(publication)

    parent_features =
      doc
      |> get_docs_in_relation(["isRecordedIn", "liesWithin", "isBelow"])
      |> Data.get_map_feature_collection(publication)

    document_feature_info =
      case Data.create_map_feature(doc, hierarchy, publication) do
        {:error, _} ->
          %{}

        {:ok, {category_labels, feature}} ->
          %{category_labels: category_labels, feature: feature}
      end

    document_geometry_type =
      case document_feature_info do
        %{feature: %{properties: %{type: type}}} ->
          type

        _ ->
          "None"
      end

    socket = assign(socket, assigns)

    socket =
      if parent_features.features == [] and children_features.features == [] and
           is_nil(document_geometry_type) do
        socket
      else
        socket
        |> push_event("document-map-update-#{id}", %{
          project: publication.project_name,
          draft_date: publication.draft_date,
          document_uuid: doc.id,
          document_feature_info: document_feature_info,
          children_features: children_features,
          parent_features: parent_features,
          ancestor_features: %{}
        })
        |> assign(:document_geometry_type, document_geometry_type)
        |> assign(:no_data, false)
      end

    {
      :ok,
      socket
    }
  end

  defp set_defaults(assigns) do
    assigns
    |> Map.put_new(:centerLon, 0)
    |> Map.put_new(:centerLat, 0)
    |> Map.put_new(:zoom, 2)
    |> Map.put(:no_data, true)
    |> Map.put_new(:language, Gettext.get_locale(FieldPublicationWeb.Translate))
    |> Map.put(:show_layer_select, false)
    |> Map.put_new(:focus, :default)
    |> Map.put(:uuid, assigns.doc.id)
    |> Map.put_new(:draw_box_mode, false)
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

  def handle_event(
        "toggle-layer",
        %{"group" => group, "uuid" => uuid},
        %{assigns: %{id: id}} = socket
      ) do
    toggled_group =
      if group == "project", do: :project_tile_layers_state, else: :document_tile_layers_state

    layer_states =
      socket.assigns[toggled_group]
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
      |> assign(toggled_group, layer_states)
      |> push_event("document-map-set-layer-visibility-#{id}", %{
        uuid: uuid,
        visibility:
          Enum.find(layer_states, fn state -> state.uuid == uuid end) |> Map.get(:visible)
      })
    }
  end

  def handle_event(
        "visibility-preference",
        %{"group" => group, "uuid" => uuid, "value" => value},
        socket
      )
      when is_boolean(value) do
    # When a map background layer is loaded on the client side, the client side hook will
    # send this event if the client's localStorage contained a visibility preference for
    # the added layer.
    #
    # The client will have set the layer visibility at this point and uses this event to make
    # sure the server state is the same as in the client's browser.
    set_group =
      if group == "project", do: :project_tile_layers_state, else: :document_tile_layers_state

    layer_states =
      socket.assigns[set_group]
      |> Enum.map(fn state ->
        if state.uuid == uuid do
          Map.put(state, :visible, value)
        else
          state
        end
      end)

    {
      :noreply,
      assign(socket, set_group, layer_states)
    }
  end

  defp toggle_draw_mode(%{assigns: %{id: id, draw_box_mode: current}} = socket) do
    new_value = !current

    socket
    |> assign(:draw_box_mode, new_value)
    |> push_event("set-draw-box-mode-#{id}", %{new_value: new_value})
  end

  # defp create_feature_info(
  #        %Document{
  #          category: %Category{color: color, labels: category_labels},
  #          id: uuid,
  #          identifier: identifier,
  #          geometry: geometry
  #        } = doc
  #      ) do
  #   description =
  #     doc
  #     |> Data.get_field_value("shortDescription")
  #     |> case do
  #       nil ->
  #         ""

  #       value when is_binary(value) ->
  #         value

  #       values when is_map(values) ->
  #         pick_default_translation(values)
  #     end

  #   category = pick_default_translation(category_labels)

  #   base = %{
  #     type: "Feature",
  #     properties: %{
  #       uuid: uuid,
  #       identifier: identifier,
  #       color: color,
  #       description: description,
  #       category: category
  #     }
  #   }

  #   if geometry do
  #     base
  #     |> put_in([:geometry], geometry)
  #     |> put_in([:properties, :type], geometry["type"])
  #   else
  #     base
  #   end
  # end

  def extract_tile_layer_info(%{
        "resource" => %{
          "georeference" => georeference,
          "height" => height,
          "width" => width,
          "id" => uuid,
          "identifier" => identifier
        }
      }) do
    %{
      extent: georeference,
      height: height,
      width: width,
      uuid: uuid,
      identifier: identifier
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
        |> Stream.map(&extract_tile_layer_info/1)
        |> Enum.map(fn layer_info ->
          Map.merge(layer_info, %{visible: true})
        end)

      other_map_layers =
        Map.get(project_doc_relations, "hasMapLayer", [])
        |> Data.get_raw_documents(current)
        |> Stream.map(&extract_tile_layer_info/1)
        |> Stream.map(fn layer_info ->
          Map.merge(layer_info, %{visible: false})
        end)
        |> Enum.reject(fn entry ->
          entry.uuid in Map.get(project_doc_relations, "hasDefaultMapLayer", [])
        end)

      socket
      |> push_event("document-map-set-project-layers-#{hook_id}", %{
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

  defp process_document_tile_layers(socket, publication, %{} = doc, hook_id) do
    Logger.debug("Setting document level background layers.")

    default_map_layers =
      doc.default_map_layers
      |> Data.get_raw_documents(publication)
      |> Stream.map(&extract_tile_layer_info/1)
      |> Enum.map(fn layer_info ->
        Map.merge(layer_info, %{visible: true})
      end)

    other_map_layers =
      doc.map_layers
      |> Data.get_raw_documents(publication)
      |> Stream.map(&extract_tile_layer_info/1)
      |> Enum.map(fn layer_info ->
        Map.merge(layer_info, %{visible: false})
      end)
      |> Enum.reject(fn entry -> entry.uuid in doc.default_map_layers end)

    socket
    |> push_event("document-map-set-document-layers-#{hook_id}", %{
      project: publication.project_name,
      document_tile_layers: default_map_layers ++ other_map_layers
    })
    |> assign(
      :document_tile_layers_state,
      default_map_layers ++ other_map_layers
    )
  end

  def render_tile_layer_selection_group(assigns) do
    ~H"""
    <%= if @layer_states != [] do %>
      <div class="font-semibold pb-2">
        {if @group == :project, do: gettext("Project layers"), else: gettext("Document layers")}
      </div>
      <%= for layer  <- @layer_states do %>
        <div class="text-xs">
          <span
            class="cursor-pointer"
            phx-target={@target}
            phx-click="toggle-layer"
            phx-value-group={@group}
            phx-value-uuid={layer.uuid}
          >
            <.icon class="mb-1" name={if layer.visible, do: "hero-eye", else: "hero-eye-slash"} />
          </span>
          <.link patch={
            ~p"/projects/#{@publication.project_name}/#{@publication.draft_date}/#{layer.uuid}"
          }>
            {layer.identifier}
          </.link>
        </div>
      <% end %>
    <% end %>
    """
  end

  defp get_docs_in_relation(%Document{} = doc, relation_names) do
    relation_names
    |> Enum.map(fn relation_name ->
      doc
      |> Data.get_relation(relation_name)
      |> case do
        nil ->
          []

        %RelationGroup{docs: docs} ->
          docs
      end
    end)
    |> List.flatten()

    # lies_within =
    #   doc
    #   |> Data.get_relation("liesWithin")
    #   |> case do
    #     nil ->
    #       []

    #     %RelationGroup{} = relation ->
    #       Enum.map(relation.docs, &create_feature_info(&1, lang))
    #   end
    #   |> Enum.filter(fn feature -> Map.has_key?(feature, :geometry) end)

    # is_recorded_in =
    #   doc
    #   |> Data.get_relation("isRecordedIn")
    #   |> case do
    #     nil ->
    #       []

    #     %RelationGroup{} = relation ->
    #       Enum.map(relation.docs, &create_feature_info(&1, lang))
    #   end
    #   |> Enum.filter(fn feature -> Map.has_key?(feature, :geometry) end)
  end
end
