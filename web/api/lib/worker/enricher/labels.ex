defmodule Api.Worker.Enricher.Labels do
  require Logger
  alias Api.Core
  alias Api.Core.CategoryTreeList
  alias Api.Worker.Enricher.Utils

  @core_properties [:id, :identifier, :shortDescription, :geometry, :geometry_wgs84, :georeference,
    :gazId, :parentId, :featureVectors, :license, :shortName, :originalFilename]

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
      |> Core.Utils.atomize
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

      Utils.get_field_definition(category_definition.groups, field_name) == nil ->
        Logger.warn "Label not found: field \"#{field_name}\" of category \"#{category_definition.name}\""
        resource
      true ->
        case field_value do
          [_|_] -> put_in(resource[field_name], Enum.map(field_value, &get_value_with_label(field_name, &1, category_definition)))
          _ -> put_in(resource[field_name], get_value_with_label(field_name, field_value, category_definition))
        end
    end
  end

  defp get_value_with_label(field_name, field_value, category_definition) do
    field_definition = Utils.get_field_definition(category_definition.groups, field_name)
    get_value_with_label(field_name, field_value, category_definition, field_definition)
  end
  defp get_value_with_label(field_name, dimension, category_definition, field_definition = %{ inputType: "dimension" }) do
    position = dimension["measurementPosition"]
    label = if is_nil(position) do nil else get_label(field_name, position, category_definition, field_definition) end
    if !is_nil(label) do
      put_in(dimension["measurementPosition"], %{ name: position, label: label })
    else
      dimension
    end
  end
  defp get_value_with_label(field_name, range_value = %{ "value" => value }, category_definition, field_definition = %{ inputType: "dropdownRange" }) when is_binary(value) do
    range_value
    |> put_labels_in_subfields(field_name, "value", category_definition, field_definition)
    |> put_labels_in_subfields(field_name, "endValue", category_definition, field_definition)
  end
  defp get_value_with_label(field_name, composite_value, category_definition, field_definition = %{ inputType: "composite" }) do
    Enum.reduce(composite_value, %{}, put_labels_in_composite_subfields(field_name, category_definition, field_definition))
    |> Enum.into(%{})
  end
  defp get_value_with_label(field_name, field_value, category_definition, field_definition) do
    label = get_label(field_name, field_value, category_definition, field_definition)
    if !is_nil(label) do
      %{ name: field_value, label: label }
    else
      field_value
    end
  end

  defp get_subfield_value_with_label(subfield_name, subfield_value, category_definition, subfield_definition) do
    label = get_label(subfield_name, subfield_value, category_definition, subfield_definition)
    if !is_nil(label) do
      %{ name: subfield_value, label: label }
    else
      subfield_value
    end
  end

  defp put_labels_in_subfields(field_value, field_name, field_value_subfield, category_definition, field_definition) do
    label = get_label(field_name, field_value[field_value_subfield], category_definition, field_definition)
    if !is_nil(label) do
      put_in(field_value[field_value_subfield], %{ name: field_value[field_value_subfield], label: label })
    else
      field_value
    end
  end

  defp put_labels_in_composite_subfields(field_name, category_definition, field_definition) do
    fn { subfield_name, subfield_value }, field_value ->
      subfield_definition = Utils.get_subfield_definition(field_definition, subfield_name)
      case subfield_value do
        [_|_] -> put_in(field_value[subfield_name], Enum.map(subfield_value, &get_subfield_value_with_label(subfield_name, &1, category_definition, subfield_definition)))
        _ -> put_in(field_value[subfield_name], get_subfield_value_with_label(subfield_name, subfield_value, category_definition, subfield_definition))
      end
    end
  end

  defp get_label(_, nil, _, _), do: nil
  defp get_label(field_name, field_value, category_definition, field_definition) do
     cond do
      is_nil(field_definition) -> raise "No field definition found for field #{field_name} of category "
        <> category_definition.name
      !Map.has_key?(field_definition, :valuelist) -> nil
      Map.has_key?(field_definition[:valuelist]["values"], field_value) ->
        get_labels_object(field_definition[:valuelist]["values"][field_value])
      true -> %{}
     end
  end

  defp get_labels_object(%{ "label" => labels }), do: labels
  defp get_labels_object(_), do: %{}
end
