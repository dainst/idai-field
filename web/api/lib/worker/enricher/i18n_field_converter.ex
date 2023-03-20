defmodule Api.Worker.Enricher.I18NFieldConverter do

  alias Api.Core.CategoryTreeList
  alias Api.Worker.Enricher.Labels

  defp convert_string(resource, field_name, field_value) when not is_map(field_value) do  # this is from legacy project then
    put_in(resource, [field_name], %{ unspecifiedLanguage: field_value })
  end
  defp convert_string resource, _field_name, _field_value do
    resource
  end

  defp convert_resource_field category_definition do
    fn {field_name, field_value}, resource ->
      field_definition = Labels.get_field_definition category_definition, Atom.to_string(field_name)
      if is_nil(field_definition[:inputType]) do
        resource
      else
        if field_definition[:inputType] == "input" do
          convert_string resource, field_name, field_value
        else
          resource
        end
      end
    end
  end

  def convert_category change = %{ doc: %{ resource: resource } }, category_definition do
    resource = Enum.reduce(resource, resource, convert_resource_field(category_definition))
    put_in(change.doc.resource, resource)
  end

  def convert change, configuration do
    name = change.doc.resource.category.name # TODO review category.name, maybe document the expectation
    category_definition = CategoryTreeList.find_by_name(name, configuration)
    convert_category change, category_definition
  end
end
