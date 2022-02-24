defmodule Api.Worker.Enricher.Labels do
  require Logger
  alias Api.Core.Utils
  alias Api.Core.CategoryTreeList

  @core_properties [:id, :identifier, :shortDescription, :geometry, :geometry_wgs84, :georeference,
    :gazId, :parentId, :featureVectors, :literature0, :license, :shortName]

  def add_labels(change = %{ doc: %{ resource: resource } }, configuration) do
    put_in(change.doc.resource, add_labels_to_resource(resource, configuration))
  end
  def add_labels(change, _), do: change

  defp add_labels_to_resource(resource, configuration) do
    category_definition = CategoryTreeList.find_by_name(resource.category, configuration)
    if is_nil(category_definition) do
      raise "No category definition found for category #{resource.category}"
    else
      Enum.reduce(resource, %{}, add_labels_to_field(category_definition, configuration))
      |> Enum.into(%{})
      |> Utils.atomize
    end
  end

  defp add_labels_to_relation({ relationName, targets }, configuration) do
    { relationName, Enum.map(targets, &add_labels_to_relation_target(&1, configuration)) }
  end

  defp add_labels_to_relation_target(deleted_target = %{ deleted: true }, _), do: deleted_target
  defp add_labels_to_relation_target(relation_target = %{ resource: resource }, configuration) do
    if Map.has_key?(relation_target.resource, :relations) do
      # Would possibly not terminate then because of infinite mutual recursion
      raise "Relation targets must not have :relations keys set"
    else
      put_in(relation_target.resource, add_labels_to_resource(resource, configuration))
    end
  end

  defp add_labels_to_field(category_definition, category) do
    fn field, resource -> add_labels_to_field(resource, field, category_definition, category) end
  end
  defp add_labels_to_field(resource, { :category, field_value }, category_definition, _) do
    put_in(resource[:category], %{ name: field_value, label: category_definition.label })
  end
  defp add_labels_to_field(resource, { :relations, relations }, _, configuration) do
    put_in(resource[:relations], Enum.map(relations, &add_labels_to_relation(&1, configuration)) |> Enum.into(%{}))
  end
  defp add_labels_to_field(resource, { field_name, field_value }, category_definition, _) do
    cond do
      Enum.member?(@core_properties, field_name) -> put_in(resource, [field_name], field_value)

      get_field_definition(category_definition, field_name) == nil ->
        Logger.warn "Label not found: field \"#{field_name}\" of category \"#{category_definition.name}\""
        resource
      true ->
        case field_value do
          [_|_] -> put_in(resource[field_name], Enum.map(field_value, &get_value_with_label(field_name, &1, category_definition)))
          _ -> put_in(resource[field_name], get_value_with_label(field_name, field_value, category_definition))
        end
    end
  end

  defp get_value_with_label(field_name, dimension = %{ "measurementPosition" => position }, category_definition) do
    label = get_label(field_name, position, category_definition, :positionValues)
    if !is_nil(label) do
      put_in(dimension["measurementPosition"], %{ name: position, label: label })
    else
      dimension
    end
  end
  defp get_value_with_label(field_name, period = %{ "value" => value }, category_definition) when is_binary(value) do
    period
    |> put_labels_in_subfields(field_name, "value", category_definition)
    |> put_labels_in_subfields(field_name, "endValue", category_definition)
  end
  defp get_value_with_label(field_name, field_value, category_definition) do
    label = get_label(field_name, field_value, category_definition, :valuelist)
    if !is_nil(label) do
      %{ name: field_value, label: label }
    else
      field_value
    end
  end

  defp put_labels_in_subfields(field_value, field_name, field_value_subfield, category_definition) do
    label = get_label(field_name, field_value[field_value_subfield], category_definition, :valuelist)
    if !is_nil(label) do
      put_in(field_value[field_value_subfield], %{ name: field_value[field_value_subfield], label: label })
    else
      field_value
    end
  end

  defp get_label(_, nil, _, _), do: nil
  defp get_label(field_name, field_value, category_definition, valuelist_property_name) do
     field_definition = get_field_definition(category_definition, field_name)
     cond do
      is_nil(field_definition) -> raise "No field definition found for field #{field_name} of category "
        <> category_definition.name
      !Map.has_key?(field_definition, valuelist_property_name) -> nil
      Map.has_key?(field_definition[valuelist_property_name]["values"], field_value) ->
        get_labels_object(field_definition[valuelist_property_name]["values"][field_value])
      true -> %{}
     end
  end

  defp get_field_definition(category_definition, field_name) do
    group = Enum.find(category_definition.groups, &get_field_definition_from_group(&1, field_name))
    get_field_definition_from_group(group, field_name)
  end

  defp get_field_definition_from_group(%{ fields: fields }, field_name) do
    Enum.find(fields, fn field -> field.name == field_name end)
  end
  defp get_field_definition_from_group(_, _), do: nil

  defp get_labels_object(%{ "labels" => labels }), do: labels
  defp get_labels_object(_), do: %{}
end
