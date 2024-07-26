defmodule FieldPublicationWeb.Presentation.Components.ProjectMap do
  alias FieldPublication.Publications.Data
  use FieldPublicationWeb, :live_component

  @impl true
  def render(assigns) do
    ~H"""
    <div
      id={@id}
      style={@style}
      centerLon={@centerLon}
      centerLat={@centerLat}
      zoom={@zoom}
      phx-hook="ProjectMap"
    >
    </div>
    """
  end

  # project layers
  # additional layers
  # highlighted documents
  # additional documents

  @impl true
  def update(
        %{
          id: id,
          project_layer_documents: project_layer_documents,
          additional_layer_documents: additional_layer_documents,
          highlighted_geometry_documents: highlighted_geometry_documents,
          additional_geometry_documents: additional_geometry_documents,
          project_name: project_name
        } = assigns,
        socket
      ) do
    assigns = set_defaults(assigns)

    project_layer_tile_info = Enum.map(project_layer_documents, &extract_tile_layer_info/1)

    highlighted_geometry_info = %{
      type: "FeatureCollection",
      features: Enum.map(highlighted_geometry_documents, &extract_vector_layer_info(&1, true))
    }

    additional_geometry_info = %{
      type: "FeatureCollection",
      features: Enum.map(additional_geometry_documents, &extract_vector_layer_info(&1))
    }

    socket =
      socket
      |> assign(assigns)
      |> push_event("map-set-background-layers-#{id}", %{
        target: id,
        project: project_name,
        project_layers: project_layer_tile_info,
        highlighted_geometry_info: highlighted_geometry_info,
        additional_geometry_info: additional_geometry_info
      })

    {:ok, socket}
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

  defp extract_vector_layer_info(
         %{"category" => %{"color" => color}, "id" => uuid} = doc,
         highlighted \\ false
       ) do
    geometry =
      Data.get_field_value(doc, "geometry")

    %{
      type: "Feature",
      geometry: geometry,
      properties: %{
        uuid: uuid,
        color: color,
        highlighted: highlighted
      }
    }
  end

  defp set_defaults(assigns) do
    assigns
    |> Map.put_new(:centerLon, 0)
    |> Map.put_new(:centerLat, 0)
    |> Map.put_new(:zoom, 2)
  end
end
