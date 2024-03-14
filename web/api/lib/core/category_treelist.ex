defmodule Api.Core.CategoryTreeList do

  def find_by_name(target_name, category_tree_list) do
    Api.Core.Tree.find_in_tree_list(
      fn %{ name: name } -> target_name == name end,
      category_tree_list
    )
  end

  def get_supercategory(target_name, category_tree_list) do
    result = Enum.find(category_tree_list, fn %{ trees: trees } ->
      Enum.find(trees, fn %{ item: %{ name: name } } -> name == target_name end)
    end)
    if is_nil(result) do
      nil
    else
      result.item
    end
  end
end
