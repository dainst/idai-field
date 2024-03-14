defmodule Api.Worker.Mapper do
  alias Api.Core.CategoryTreeList
  alias Api.Core.ProjectConfig

  def process(configuration), do: fn change -> process(change, configuration) end
  def process(change = %{ doc: %{ resource: %{ category: "Project" }}}, _) do
    id = change.doc.resource.identifier
    change = put_in(change.doc.resource.id, id)
    put_in(change.id, id)
    |> rename_type_to_category
  end
  def process(change = %{ deleted: true }, _), do: change
  def process(change, configuration) do
    change
    |> rename_type_to_category
    |> convert_period
    |> convert_dating_fields(configuration)
  end

  def rename_type_to_category(change = %{ doc: %{ resource: %{ type: _ } }}) do
    {category, new_change} = pop_in(change[:doc][:resource][:type])
    put_in(new_change, [:doc, :resource, :category], category)
  end
  def rename_type_to_category(change), do: change

  defp convert_period(change = %{ doc: %{ resource: resource }}) do
    if resource["period"] == nil or is_map(resource["period"]) do
      change
    else
      {_, change} =
        change
        |> put_in([:doc, :resource, "period"],
             if resource["periodEnd"] == nil do
               %{ "value" => resource["period"] }
             else
               %{ "value" => resource["period"], "endValue" => resource["periodEnd"] }
             end)
        |> pop_in([:doc, :resource, "periodEnd"])
      change
    end
  end

  defp convert_dating_fields(change = %{ doc: %{ resource: resource }}, configuration) do
    category_definition = CategoryTreeList.find_by_name(resource.category, configuration)
    converted_resource = Enum.reduce(resource, %{}, convert_dating_field(category_definition))
      |> Enum.into(%{})
    put_in(change, [:doc, :resource], converted_resource)
  end

  defp convert_dating_field(category_definition) do
    fn field, resource -> convert_dating_field(resource, field, get_field_definition(field, category_definition)) end
  end
  defp convert_dating_field(resource, { field_name, dating_entries }, %{ inputType: "dating" }) do
    put_in(resource[field_name], Enum.map(dating_entries, &convert_dating_entry(&1)))
  end
  defp convert_dating_field(resource, { field_name, field_value }, _) do
    put_in(resource[field_name], field_value)
  end

  defp get_field_definition({ field_name, _}, category_definition) do
    ProjectConfig.get_field_definition(category_definition.groups, field_name)
  end

  defp convert_dating_entry(dating_entry = %{ "type" => "exact" }) do
    put_in(dating_entry, ["type"], "single")
  end
  defp convert_dating_entry(dating_entry), do: dating_entry
end
