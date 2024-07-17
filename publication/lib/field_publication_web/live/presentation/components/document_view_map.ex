defmodule FieldPublicationWeb.Presentation.Components.DocumentViewMap do
  use FieldPublicationWeb, :live_component

  import FieldPublicationWeb.Presentation.Components.Typography

  alias FieldPublication.DocumentSchema.Publication
  alias FieldPublication.Publications.Data

  def render(assigns) do
    ~H"""
    <div>
      <.group_heading>Geometry <span class="text-xs">(<%= @type %>)</span></.group_heading>
      <div
        class="relative"
        id={@id}
        centerLon={@centerLon}
        centerLat={@centerLat}
        zoom={@zoom}
        phx-hook="DocumentViewMap"
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
        %{id: id, publication: %Publication{} = publication, doc: doc, lang: lang} =
          assigns,
        socket
      ) do
    assigns = set_defaults(assigns)

    socket =
      if not Map.has_key?(socket.assigns, :publication) or
           not Map.equal?(socket.assigns.publication, publication) do
        project_tile_layers =
          publication
          |> Data.get_project_map_layers()
          |> Enum.map(&extract_tile_layer_info/1)

        push_event(socket, "document-map-set-project-layers-#{id}", %{
          project: publication.project_name,
          project_tile_layers: project_tile_layers
        })
      else
        socket
      end

    children =
      doc
      |> Data.get_relation_by_name("contains")
      |> case do
        nil ->
          []

        relation ->
          Map.get(relation, "values", [])
      end

    parent_features =
      doc
      |> Data.get_relation_by_name("liesWithin")
      |> case do
        nil ->
          []

        relation ->
          relation
          |> Map.get("values", [])
          |> Enum.map(&create_feature_info(&1, lang))
      end
      |> Enum.filter(fn feature -> Map.has_key?(feature, :geometry) end)
      |> case do
        [] ->
          doc
          |> Data.get_relation_by_name("isRecordedIn")
          |> case do
            nil ->
              []

            relation ->
              relation
              |> Map.get("values", [])
              |> Enum.map(&create_feature_info(&1, lang))
          end
          |> Enum.filter(fn feature -> Map.has_key?(feature, :geometry) end)

        geometries_present ->
          geometries_present
      end

    children_features =
      children
      |> Enum.map(&create_feature_info(&1, lang))
      |> Enum.filter(fn feature -> Map.has_key?(feature, :geometry) end)

    document_feature = create_feature_info(doc, lang)

    assigns = Map.put(assigns, :type, get_in(document_feature, [:properties, :type]) || "None")

    socket = assign(socket, assigns)

    socket =
      if parent_features == [] and children_features == [] and
           not Map.has_key?(document_feature, :geometry) do
        socket
      else
        socket
        |> push_event("document-map-update-#{id}", %{
          project: publication.project_name,
          document_feature: document_feature,
          children_features: %{
            type: "FeatureCollection",
            features: children_features
          },
          parent_features: %{
            type: "FeatureCollection",
            features: parent_features
          }
        })
        |> assign(:no_data, false)
      end

    {
      :ok,
      socket
    }
  end

  defp set_defaults(%{publication: pub} = assigns) do
    assigns
    |> Map.put_new(:centerLon, 0)
    |> Map.put_new(:centerLat, 0)
    |> Map.put_new(:zoom, 2)
    |> Map.put(
      :project_tile_layers,
      pub
      |> Data.get_project_map_layers()
      |> Enum.map(&extract_tile_layer_info/1)
    )
    |> Map.put(:no_data, true)
  end

  defp create_feature_info(
         %{
           "category" => %{"color" => color, "labels" => category_labels},
           "id" => uuid,
           "identifier" => identifier
         } = doc,
         lang
       ) do
    description =
      doc
      |> Data.get_field_values("shortDescription")
      |> case do
        nil ->
          ""

        value when is_binary(value) ->
          value

        value when is_map(value) ->
          Map.get(value, lang, Map.get(value, List.first(Map.keys(value))))
      end

    category =
      Map.get(
        category_labels,
        Gettext.get_locale(FieldPublicationWeb.Gettext),
        Map.get(category_labels, List.first(Map.keys(category_labels)))
      )

    base = %{
      type: "Feature",
      properties: %{
        uuid: uuid,
        identifier: identifier,
        color: color,
        description: description,
        category: category
      }
    }

    if geometry = Data.get_field_values(doc, "geometry") do
      base
      |> put_in([:geometry], geometry)
      |> put_in([:properties, :type], geometry["type"])
    else
      base
    end
  end

  defp extract_tile_layer_info(%{
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
end
