defmodule FieldPublicationWeb.Presentation.Components.DocumentViewMap do
  use FieldPublicationWeb, :live_component

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
        project_key={@publication.project_name}
        draft_date={@publication.draft_date}
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
          publication: %Publication{} = publication,
          doc: %Document{} = doc,
          ancestors: _ancestors
        } =
          assigns,
        socket
      ) do
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

    socket = assign(socket, set_defaults(assigns))

    socket =
      if parent_features.features == [] and children_features.features == [] and
           document_geometry_type == "None" do
        assign(socket, :no_data, true)
      else
        socket
        |> assign(:no_data, false)
        |> push_event("document-map-update-#{id}", %{
          document_uuid: doc.id,
          document_feature_info: document_feature_info,
          children_features: children_features,
          parent_features: parent_features,
          ancestor_features: %{}
        })
        |> assign(:document_geometry_type, document_geometry_type)
        |> assign(:doc, doc)
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
    |> Map.put_new(:draw_box_mode, false)
    |> Map.put_new(:language, Gettext.get_locale(FieldPublicationWeb.Translate))
    |> Map.put_new(:focus, :default)
    |> Map.put(:uuid, assigns.doc.id)
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
  end
end
