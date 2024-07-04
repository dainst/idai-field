defmodule FieldPublicationWeb.Presentation.Components.DocumentViewMap do
  use FieldPublicationWeb, :live_component

  import FieldPublicationWeb.Presentation.Components.Typography

  alias FieldPublication.Publications.Data
  alias FieldPublicationWeb.Presentation.Components.GenericField

  def render(assigns) do
    ~H"""
    <div>
    <.group_heading>Geometry <span class="text-xs">(<%= @type %>)</span></.group_heading>

    <div
      id={@id}
      centerLon={@centerLon}
      centerLat={@centerLat}
      zoom={@zoom}
      phx-hook="DocumentViewMap"
    >
      <div style={@style} id={"#{@id}-map"}></div>
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
    </div>
    """
  end

  def update(
        %{id: id, publication: publication, doc: doc, lang: lang} =
          assigns,
        socket
      ) do
    assigns = set_defaults(assigns)

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

    document_feature = create_feature_info(doc, lang)

    project_tile_layers =
      publication
      |> Data.get_project_map_layers()
      |> Enum.map(&extract_tile_layer_info/1)

    assigns = Map.put(assigns, :type, get_in(document_feature, [:properties, :type]) || "None")

    {
      :ok,
      socket
      |> assign(assigns)
      |> push_event("document-map-update-#{id}", %{
        project: publication.project_name,
        document_feature: document_feature,
        children_features: %{
          type: "FeatureCollection",
          features:
            children
            |> Enum.map(&create_feature_info(&1, lang))
            |> Enum.reject(fn feature -> feature == nil end)
        },
        parent_features: %{
          type: "FeatureCollection",
          features: parent_features
        },
        project_tile_layers: project_tile_layers
      })
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
           "id" => uuid
         }
       }) do
    %{
      extent: georeference,
      height: height,
      width: width,
      uuid: uuid
    }
  end
end
