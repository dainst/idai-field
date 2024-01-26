defmodule Api.Core.ProjectConfig do

  def get_label(config, category, field) do
    with category_config <- Api.Core.CategoryTreeList.find_by_name(category, config),
         fields_config <- Enum.flat_map(category_config.groups, &(&1.fields)),
         field_config <- Enum.find(fields_config, &(&1.name == field))
    do
      field_config.label
    end
  end

  def get_field_definition(category_definition_groups, field_name) do
    group = Enum.find(category_definition_groups, &get_field_definition_from_group(&1, field_name))
    get_field_definition_from_group(group, field_name)
  end

  def get_subfield_definition(composite_field_definition, subfield_name) do
    Enum.find(composite_field_definition.subfields, fn subfield -> subfield.name == subfield_name end)
  end

  defp get_field_definition_from_group(%{ fields: fields }, field_name) do
    Enum.find(fields, fn field -> field.name == field_name end)
  end
  defp get_field_definition_from_group(_, _), do: nil
end
