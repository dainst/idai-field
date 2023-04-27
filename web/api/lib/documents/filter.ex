defmodule Api.Documents.Filter do

  alias Api.Core.CategoryTreeList

  def parse(nil), do: nil
  def parse([]), do: nil
  def parse(filter_strings = [_|_]), do: Enum.map(filter_strings, &parse_filter_string/1)

  def split_off_multilanguage_filters(nil, _), do: {nil, nil}
  def split_off_multilanguage_filters(filters = [_|_], project_conf) do
    unless has_exactly_one_category_filter? filters do
      {filters, []}
    else
      category_name = get_category_name filters
      category_definition = CategoryTreeList.find_by_name category_name, project_conf
      input_fields = get_input_field_names category_definition

      {filters, multilanguage_filters} = Enum.split_with(filters, fn {name, _value} ->        
        field_name = String.replace name, "resource.", ""
        field_name not in input_fields
      end)
      {filters, preprocess_multilanguage_filters multilanguage_filters}
    end
  end

  def expand(nil, _), do: nil
  def expand(filters = [_|_], project_conf), do: Enum.map(filters, &(expand_filter(&1, project_conf)))

  defp preprocess_multilanguage_filters multilanguage_filters do
    Enum.map multilanguage_filters, fn {name, value} ->
      [{name <> ".de", value},
       {name <> ".en", value}]
    end
  end

  defp get_input_field_names category_definition do
    category_definition.groups
        |> Enum.map(fn group -> group.fields end)
        |> List.flatten
        |> Enum.filter(fn field -> field.inputType == "input" end)
        |> Enum.map(fn field -> field.name end)
  end

  defp get_category_name filters do
    {_, category_name} = List.first (Enum.filter filters, fn {name, _} ->
      name == "resource.category.name"
    end)
    category_name
  end

  defp has_exactly_one_category_filter?(nil, _), do: false
  defp has_exactly_one_category_filter?(filters = [_|_]) do
    1 == length Enum.filter filters, fn {name, _} ->
      name == "resource.category.name"
    end
  end

  defp parse_filter_string(filter_string) do
    [field, value] = String.split(filter_string, ":")
    {field, [String.replace(value, "%3A", ":")]}
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
