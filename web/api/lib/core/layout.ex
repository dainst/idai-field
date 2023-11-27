defmodule Api.Core.Layout do
  alias Api.Core.Utils
  alias Api.Core.Resource

  def to_layouted_resource(configuration, resource, project_resource) do
    %{ groups: config_groups } = Api.Core.CategoryTreeList.find_by_name(resource.category["name"], configuration)

    resource
    |> put_in([:groups], Enum.flat_map(config_groups, scan_group(resource)))
    |> put_in([:parentId], Resource.get_parent_id(resource))
    |> put_in([:grandparentId], Resource.get_grandparent_id(resource))
    |> add_license(project_resource)
    |> Map.take(Api.Core.CorePropertiesAtomizing.get_core_properties())
    |> Utils.atomize # TODO why this?
  end

  defp scan_group(resource) do
    fn config_item ->
      group = %{
          fields: Enum.flat_map(config_item.fields, scan_field(resource)),
          name: config_item.name
      }
      if group.fields != nil, do: [group], else: []
    end
  end

  defp scan_field(resource) do
    fn config_item -> scan_field(resource, config_item) end
  end
  defp scan_field(resource, config_item = %{ inputType: inputType })
      when inputType in ["relation", "instanceOf"] do
    targets = resource.relations[String.to_atom(config_item.name)]

    unless targets && length(targets) > 0, do: [], else:
      [%{
        name: config_item.name,
        label: config_item.label,
        description: config_item.description,
        inputType: inputType,
        targets: targets
      }]
  end
  defp scan_field(resource, config_item) do
    value = resource[config_item.name] || resource[String.to_atom(config_item.name)]

    unless value, do: [], else:
      [%{
          name: config_item.name,
          label: config_item.label,
          description: config_item.description,
          inputType: config_item.inputType,
          value: scan_value(value, config_item)
      }]
  end

  defp add_license(resource, %{ license: license }), do: put_in(resource, [:license], license)
  defp add_license(resource, _project_resource), do: resource

  defp scan_value(value, config_item = %{ inputType: "composite" }) do
    Enum.map(value, scan_composite_entry(config_item))
  end
  defp scan_value(value, config_item) do
    Api.Core.Utils.atomize(value)
  end

  defp scan_composite_entry(config_item) do
    fn entry ->
      Enum.map(config_item.subfields, scan_subfield_value(entry))
      |> Enum.reject(&is_nil/1)
    end
  end

  defp scan_subfield_value(composite_entry) do
    fn subfield_definition ->
      subfield_value = scan_value(composite_entry[subfield_definition.name], subfield_definition)
      get_layouted_subfield_value(subfield_value, subfield_definition)
    end
  end

  defp get_layouted_subfield_value(nil, subfield_definition), do: nil
  defp get_layouted_subfield_value(subfield_value, subfield_definition) do
    %{
      name: subfield_definition.name,
      label: subfield_definition.label,
      description: subfield_definition.description,
      inputType: subfield_definition.inputType,
      value: subfield_value
    }
  end
end
