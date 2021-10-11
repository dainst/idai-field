defmodule Api.Worker.Enricher.Gazetteer do
  require Logger
  alias Api.Worker.Adapter.Gazetteer
  alias Api.Core.Utils

  def add_coordinates(change = %{ doc: %{ resource: %{ gazId: gazId, category: "Project" }}}) do
      coordinates = get_coordinates_from_gazetteer(gazId)
      add_geometry(change, coordinates)
  end
  def add_coordinates(change), do: change

  defp get_coordinates_from_gazetteer(gazetteer_id) do
      Gazetteer.get_place(gazetteer_id)
      |> Utils.atomize
      |> get_coordinates_from_place
  end

  defp add_geometry(change, coordinates = [_, _]) do
      put_in change, [:doc, :resource, :geometry_wgs84], %{ type: "Point", coordinates: coordinates }
  end
  defp add_geometry(change, _coordinates), do: change

  defp get_coordinates_from_place(%{ prefLocation: %{ coordinates: [longitude, latitude] }}) do
      [longitude, latitude]
  end
  defp get_coordinates_from_place(_place) do

    Logger.error "Failed to retrieve coordinates from gazetteer place, coordinates field is missing."
    nil
  end
end
