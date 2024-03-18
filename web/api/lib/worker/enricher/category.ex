defmodule Api.Worker.Enricher.Category do
  alias Api.Core.CategoryTreeList

  def add_supercategory_name(change = %{ doc: %{ resource: resource = %{ relations: relations } } }, configuration) do
    supercategory_name = get_supercategory_name(resource, configuration)
    put_supercategory_name_in_field(change, supercategory_name)
    |> put_in([:doc, :resource, :relations], Enum.map(relations, &add_supercategory_name_to_relation(&1, configuration)) |> Enum.into(%{}))
  end
  def add_supercategory_name(change, _), do: change

  defp get_supercategory_name(resource, configuration) do
    category_name = resource.category.name
    supercategory_definition = CategoryTreeList.get_supercategory(category_name, configuration)
    if is_nil(supercategory_definition) do
      nil
    else
      supercategory_definition.name
    end
  end

  defp put_supercategory_name_in_field(change, nil), do: change
  defp put_supercategory_name_in_field(change, supercategory_name) do
    put_in(change, [:doc, :resource, :category, :parent], supercategory_name)
  end

  defp add_supercategory_name_to_relation({ relationName, targets }, configuration) do
    { relationName, Enum.map(targets, &add_supercategory_name_to_relation_target(&1, configuration)) }
  end

  defp add_supercategory_name_to_relation_target(relation_target = %{ resource: resource}, configuration) do
    supercategory_name = get_supercategory_name(resource, configuration)
    put_in(relation_target, [:resource, :category, :parent], supercategory_name)
  end
end
