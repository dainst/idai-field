defmodule Api.Documents.Filter do

  def parse(nil), do: nil
  def parse([]), do: nil
  def parse(filter_strings = [_|_]), do: Enum.map(filter_strings, &parse_filter_string/1)

  def expand(nil, _), do: nil
  def expand(filters = [_|_], project_conf), do: Enum.map(filters, &(expand_filter(&1, project_conf)))

  defp parse_filter_string(filter_string) do
    [field, value] = String.split(filter_string, ":")
    {field, [value]}
  end

  defp expand_filter({"resource.category.name", [parent_category]}, project_conf) do
    categories = [parent_category] ++
      with %{trees: child_categories_conf} <- Enum.find(project_conf, &(&1.item.name == parent_category))
      do
        Enum.map(child_categories_conf, &(&1.item.name))
      else
        _ -> []
      end
    {"resource.category.name", categories}
  end
  defp expand_filter({field, value}, _), do: {field, value}
end
