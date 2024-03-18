defmodule Api.Worker.Enricher.Relations do
  require Logger

  @result_document_properties [:shortDescription, :id, :type, :category, :identifier, :parentId, :featureVectors]

  def add_child_of_relations(change = %{ doc: %{ resource: %{ relations: relations }}}) do
    put_child_of_relation(change, get_child_of_relation_targets(relations))
  end
  def add_child_of_relations(change), do: change

  def expand(change = %{ doc: %{ resource: %{ relations: relations }}}, get_for_id) do
    put_in(change.doc.resource.relations, Enum.map(relations, &(expand_relation(&1, get_for_id))) |> Enum.into(%{}))
  end
  def expand(change, _), do: change

  defp get_child_of_relation_targets(relations) do
    case relations do
      %{ liesWithin: targets } -> targets
      %{ isRecordedIn: targets } -> targets
      _ -> nil
    end
  end

  defp put_child_of_relation(change, nil), do: change
  defp put_child_of_relation(change = %{ doc: %{ resource: %{ relations: relations }}}, targets) do
    put_in(change.doc.resource.relations, Map.put(relations, :isChildOf, targets))
  end

  defp expand_relation({ name, targets }, get_for_id) do
    { name, Enum.map(targets, &(expand_target(&1, get_for_id))) }
  end

  defp expand_target(target_id, get_for_id) do
    doc = get_for_id.(target_id)
    case doc do
      %{ resource: resource } -> map_resource(resource)
      nil -> %{ resource: %{ id: target_id }, deleted: true }
    end
  end

  defp map_resource(resource) do
    result = %{ resource: Map.take(add_parent_id(resource), @result_document_properties) }
    |> convert_short_description

    if Map.has_key?(result.resource, :type) do
      {category, result} = pop_in(result.resource[:type])
      put_in(result, [:resource, :category], category)
    else
      result
    end
  end

  defp convert_short_description(document = %{ resource: %{ shortDescription: short_description } })
      when not is_map(short_description) do
    put_in(document, [:resource, :shortDescription], %{ "unspecifiedLanguage" => short_description })
  end
  defp convert_short_description(document), do: document

  defp add_parent_id(resource) do
    child_of_targets = get_child_of_relation_targets(resource.relations)
    if child_of_targets != nil do
      put_in(resource, [:parentId], Enum.at(child_of_targets, 0))
    else
      resource
    end
  end
end
