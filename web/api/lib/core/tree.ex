defmodule Api.Core.Tree do

  def find_in_tree_list(predicate, tree_list) do
    result = Enum.find(tree_list, fn %{ item: item } ->
      predicate.(item)
    end)

    if result == nil do
      find_in_children(predicate, tree_list)
    else
      result.item
    end
  end

  defp find_in_children(predicate, tree_list) do
    all_children = Enum.map(tree_list, fn %{ trees: trees } -> trees end)
    if Enum.count(all_children) > 0 do
      find_in_tree_list(predicate, List.flatten(all_children))
    else
      nil
    end
  end

  def map_tree_list(tree_list, map_function) do
    Enum.map(
      tree_list,
      fn %{ item: item, trees: trees } -> %{ item: map_function.(item), trees: map_tree_list(trees, map_function) } end
    )
  end

  def filter_tree_list(tree_list, filter_function) do
    Enum.map(
      tree_list,
      fn %{ item: item, trees: trees } -> %{ item: item, trees: filter_tree_list(trees, filter_function) } end
    ) |> Enum.filter(fn %{ item: item, trees: trees } -> filter_function.(item) || length(trees) > 0 end)
  end
end
