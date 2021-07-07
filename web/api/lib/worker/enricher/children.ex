defmodule Api.Worker.Enricher.Children do
  
  def add_children_counts(changes) do
    children_counts = get_children_counts(changes)
    Enum.map(changes, &add_children_count(&1, children_counts))
  end

  defp add_children_count(change = %{ doc: %{ resource: %{ id: id } } }, counts) do
    put_in(change, [:doc, :resource, :childrenCount], if counts[id] != nil do counts[id] else 0 end)
  end
  defp add_children_count(change, _), do: change

  defp get_children_counts(changes) do
    Enum.reduce(changes, %{}, &update_count/2)
  end

  defp update_count(%{ doc: %{ resource: %{ relations: %{ isChildOf: [%{ resource: %{ id: target_id }}] } } } },
         count_map) do
    Map.update(count_map, target_id, 1, fn value -> value + 1 end)
  end
  defp update_count(_, count_map), do: count_map
end
