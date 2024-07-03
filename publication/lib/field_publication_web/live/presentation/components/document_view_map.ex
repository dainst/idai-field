defmodule FieldPublicationWeb.Presentation.Components.DocumentViewMap do
  use FieldPublicationWeb, :live_component

  alias FieldPublication.Publications.Data

  def render(assigns) do
    ~H"""
    <div
      id={@id}
      centerLon={@centerLon}
      centerLat={@centerLat}
      zoom={@zoom}
      phx-hook="DocumentViewMap"
    >
      <div style={@style} id={"#{@id}-map"}></div>
      <!-- Set pointer-events-none, otherwise the tooltip will block click events on the map -->
      <div class="pointer-events-none  text-xs" id={"#{@id}-identifier-tooltip"}>
        <div class="border-[1px] rounded-sm border-black flex">
          <div class="saturate-50 pl-2  text-black" id={"#{@id}-identifier-tooltip-category-bar"}>
            <div
              class="h-full bg-white/60 p-1 font-thin"
              id={"#{@id}-identifier-tooltip-category-content"}
            >
            </div>
          </div>
          <div class="grow p-1 h-full bg-white">
            <div class="pointer-events-none" id={"#{@id}-identifier-tooltip-content"}></div>
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

    parents =
      doc
      |> Data.get_relation_by_name("liesWithin")
      |> case do
        nil ->
          doc
          |> Data.get_relation_by_name("isRecordedIn")
          |> case do
            nil ->
              []

            relation ->
              Map.get(relation, "values", [])
          end

        relation ->
          Map.get(relation, "values", [])
      end

    project_tile_layers =
      publication
      |> Data.get_project_map_layers()
      |> Enum.map(&extract_tile_layer_info/1)

    {
      :ok,
      socket
      |> assign(assigns)
      |> push_event("document-map-update-#{id}", %{
        project: publication.project_name,
        document_feature: create_feature_info(doc, lang),
        children_features: %{
          type: "FeatureCollection",
          features:
            children
            |> Enum.map(&create_feature_info(&1, lang))
            |> Enum.reject(fn feature -> feature == nil end)
        },
        parent_features: %{
          type: "FeatureCollection",
          features:
            parents
            |> Enum.map(&create_feature_info(&1, lang))
            |> Enum.reject(fn feature -> feature == nil end)
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

    if geometry = Data.get_field_values(doc, "geometry") do
      %{
        type: "Feature",
        geometry: geometry,
        properties: %{
          uuid: uuid,
          identifier: identifier,
          color: color,
          description: description,
          category: category,
          type: geometry["type"]
        }
      }
    else
      nil
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
