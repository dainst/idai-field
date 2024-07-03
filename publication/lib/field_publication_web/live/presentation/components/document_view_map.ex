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
      <div class="pointer-events-none mt-[20px]" id={"#{@id}-identifier-tooltip"}>
        <div
          class="saturate-50 empty:border-0 rounded p-1 empty:p-0"
          id={"#{@id}-identifier-tooltip-content"}
        >
        </div>
      </div>
    </div>
    """
  end

  def update(
        %{id: id, publication: publication, doc: doc} =
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
      (doc
       |> Data.get_relation_by_name("isRecordedIn")
       |> case do
         nil ->
           []

         relation ->
           Map.get(relation, "values", [])
       end) ++
        (doc
         |> Data.get_relation_by_name("liesWithin")
         |> case do
           nil ->
             []

           relation ->
             Map.get(relation, "values", [])
         end)

    # parent =
    #   doc
    #   |> Data.get_relation_by_name("recordedIn")
    #   |> case do
    #     nil ->
    #       []

    #     relation ->
    #       Map.get(relation, "values", [])
    #   end

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
        document_feature: create_feature_info(doc),
        children_features: %{
          type: "FeatureCollection",
          features:
            children
            |> Enum.map(&create_feature_info/1)
            |> Enum.reject(fn feature -> feature == nil end)
        },
        parent_features: %{
          type: "FeatureCollection",
          features:
            parents
            |> Enum.map(&create_feature_info/1)
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
         %{"category" => %{"color" => color}, "id" => uuid, "identifier" => identifier} = doc
       ) do
    if geometry = Data.get_field_values(doc, "geometry") do
      %{
        type: "Feature",
        geometry: geometry,
        properties: %{
          uuid: uuid,
          identifier: identifier,
          color: color
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
