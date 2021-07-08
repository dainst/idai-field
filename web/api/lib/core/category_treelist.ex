defmodule Api.Core.CategoryTreeList do

  def find_by_name(target_name, category_tree_list) do
    Api.Core.Tree.find_in_tree_list(
      fn %{ name: name } -> target_name == name end,
      category_tree_list
    )
  end
end
