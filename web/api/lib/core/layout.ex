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
    |> Map.take(List.delete(Api.Core.CorePropertiesAtomizing.get_core_properties(), :relations))
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
          value: Api.Core.Utils.atomize(value)
      }]
  end

  defp add_license(resource, %{ license: license }), do: put_in(resource, [:license], license)
  defp add_license(resource, _project_resource), do: resource
end
