defmodule Api.Core.ProjectConfig do

  def get_label(config, category, field) do
    with category_config <- Api.Core.CategoryTreeList.find_by_name(category, config),
         fields_config <- Enum.flat_map(category_config.groups, &(&1.fields)),
         field_config <- Enum.find(fields_config, &(&1.name == field))
    do
      field_config.label
    end
  end
end
