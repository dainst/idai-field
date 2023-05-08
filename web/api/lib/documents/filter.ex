defmodule Api.Documents.Filter do

  alias Api.Core.CategoryTreeList

  def parse(nil), do: []
  def parse(filter_strings) do
    Enum.map filter_strings, fn filter_string ->
      [field, value] = String.split(filter_string, ":")
      field = if field != "project" and not is_whitelisted_term_filter(filter_string) do
        "resource." <> (if field == "category" do
          field <> ".name"
        else
          field
        end)
      else
        field
      end
      {String.replace(field, "%3A", ":"), String.replace(value, "%3A", ":")}
    end
  end

  def wrap_values_as_singletons(filters) do
    Enum.map filters, fn {name, value} -> {name, [value]} end
  end

  def split_off_multilanguage_filters_and_add_name_suffixes(filters, project_conf, languages) do
    unless has_exactly_one_category_filter? filters do
      {filters, []}
    else
      category_name = get_category_name filters
      category_definition = CategoryTreeList.find_by_name category_name, project_conf
      input_fields = get_field_names category_definition, "input"

      {filters, multilanguage_filters} = Enum.split_with(filters, fn {name, _value} ->
        field_name = String.replace name, "resource.", ""
        field_name not in input_fields
      end)
      dropdown_fields = get_field_names category_definition, "dropdown"
      filters = Enum.map filters, fn {name, value} ->
        name = if String.replace(name, "resource.", "") in dropdown_fields do
          name <> ".name"
        else
          name
        end
        {name, value}
      end
      {filters, (preprocess_multilanguage_filters multilanguage_filters, languages)}
    end
  end

  def expand_categories(nil, _), do: nil
  def expand_categories(filters, project_conf), do: Enum.map(filters, &(expand(&1, project_conf)))

  # this is to preserve already cited links
  # TODO remove and replace by nginx rewrite rule
  defp is_whitelisted_term_filter filter_string do
    filter_string == "resource.period.value.name:Phase 7"
      or filter_string == "resource.category.name:Pottery"
  end

  defp preprocess_multilanguage_filters multilanguage_filters, languages do
    Enum.map multilanguage_filters, fn {name, value} ->
      Enum.map languages ++ ["unspecifiedLanguage"], fn language -> {name <> "." <> language, value} end
    end
  end

  defp get_field_names category_definition, field_type do
    category_definition.groups
    |> Enum.map(fn group -> group.fields end)
    |> List.flatten
    |> Enum.filter(fn field -> field.inputType == field_type end)
    |> Enum.map(fn field -> field.name end)
  end

  defp get_category_name filters do
    {_, category_name} = List.first (Enum.filter filters, fn {name, _} ->
      name == "resource.category.name"
    end)
    category_name
  end

  defp has_exactly_one_category_filter?(filters) do
    1 == length Enum.filter filters, fn {name, _} ->
      name == "resource.category.name"
    end
  end

  defp expand({"resource.category.name", [parent_category]}, project_conf) do
    categories = [parent_category] ++
      with %{trees: child_categories_conf} <- Enum.find(project_conf, &(&1.item.name == parent_category))
      do
        Enum.map(child_categories_conf, &(&1.item.name))
      else
        _ -> []
      end

    {"resource.category.name", categories}
  end
  defp expand({field, value}, _), do: {field, value}
end
