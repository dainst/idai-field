defmodule Api.Worker.Mapper do
  alias Api.Core.CategoryTreeList
  alias Api.Core.ProjectConfig

  def process(configuration), do: fn change -> process(change, configuration) end
  def process(change = %{ doc: %{ resource: %{ category: "Project" }}}, _) do
    id = change.doc.resource.identifier
    change = put_in(change.doc.resource.id, id)
    put_in(change.id, id)
    |> rename_type_to_category
    |> convert_staff
    |> convert_campaigns
  end
  def process(change = %{ deleted: true }, _), do: change
  def process(change, configuration) do
    change
    |> rename_type_to_category
    |> convert_beginning_and_end_dates
    |> convert_dates(configuration)
    |> convert_period
    |> convert_dating_fields(configuration)
    |> convert_weight_field
  end

  def rename_type_to_category(change = %{ doc: %{ resource: %{ type: _ } }}) do
    {category, new_change} = pop_in(change[:doc][:resource][:type])
    put_in(new_change, [:doc, :resource, :category], category)
  end
  def rename_type_to_category(change), do: change

  defp convert_beginning_and_end_dates(change = %{ doc: %{ resource: resource }}) do
    if not Map.has_key?(resource, "beginningDate") and not Map.has_key?(resource, "endDate") do
      change
    else
      {_, change} =
        change
        |> put_in([:doc, :resource, "date"],
             if not Map.has_key?(resource, "endDate") do
               %{ "isRange" => true, "value" => resource["beginningDate"] }
             else
                if not Map.has_key?(resource, "beginningDate") do
                  %{ "isRange" => true, "endValue" => resource["endDate"] }
                else
                  %{ "isRange" => true, "value" => resource["beginningDate"], "endValue" => resource["endDate"] }
                end
             end)
        |> pop_in([:doc, :resource, "beginningDate"])
      {_, change} =
        change
        |> pop_in([:doc, :resource, "endDate"])
      change
    end
  end

  defp convert_dates(change = %{ doc: %{ resource: resource }}, configuration) do
    category_definition = CategoryTreeList.find_by_name(resource.category, configuration)
    converted_resource = Enum.reduce(resource, %{}, convert_date(category_definition))
      |> Enum.into(%{})
    put_in(change, [:doc, :resource], converted_resource)
  end

  defp convert_date(category_definition) do
    fn field, resource -> convert_date(resource, field, get_field_definition(field, category_definition)) end
  end
  defp convert_date(resource, { field_name, date_value }, %{ inputType: "date" }) when is_binary(date_value) do
    put_in(resource[field_name], %{ "value" => date_value, "isRange" => false })
  end
  defp convert_date(resource, { field_name, composite_field_entries }, field_definition = %{ inputType: "composite" }) do
    put_in(resource[field_name], Enum.map(composite_field_entries, fn entry ->
      Enum.reduce(entry, %{}, fn { subfield_name, subfield_value }, entry ->
        subfield_definition = ProjectConfig.get_subfield_definition(field_definition, subfield_name)
        if subfield_definition.inputType == "date" and is_binary(subfield_value) do
          put_in(entry[subfield_name], %{ "value" => subfield_value, "isRange" => false })
        else
          put_in(entry[subfield_name], subfield_value)
        end
      end) |> Enum.into(%{})
    end))
  end
  defp convert_date(resource, { field_name, field_value }, _) do
    put_in(resource[field_name], field_value)
  end

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

  defp convert_dating_entry(dating_entry = %{ "type" => "exact" }) do
    put_in(dating_entry, ["type"], "single")
  end
  defp convert_dating_entry(dating_entry), do: dating_entry

  defp convert_weight_field(change = %{ doc: %{ resource: %{ "weight" => weight} }}) when is_number(weight) do
    put_in(change, [:doc, :resource, "weight"], [%{"inputValue" => weight, "inputUnit" => "g", "isImprecise" => false}])
  end
  defp convert_weight_field(change), do: change

  defp convert_staff(change = %{ doc: %{ resource: %{ "staff" => staff }}}) do
    put_in(change, [:doc, :resource, "staff"], get_staff_or_campaign_values(staff))
  end
  defp convert_staff(change), do: change

  defp convert_campaigns(change = %{ doc: %{ resource: %{ "campaigns" => campaigns }}}) do
    put_in(change, [:doc, :resource, "campaigns"], get_staff_or_campaign_values(campaigns))
  end
  defp convert_campaigns(change), do: change

  defp get_staff_or_campaign_values(field_content = [_|_]) do
    Enum.map(field_content, &get_staff_or_campaign_value(&1))
  end
  defp get_staff_or_campaign_values(_), do: []

  defp get_staff_or_campaign_value(%{ "value" => value }), do: value
  defp get_staff_or_campaign_value(value), do: value

  defp get_field_definition({ field_name, _}, category_definition) do
    ProjectConfig.get_field_definition(category_definition.groups, field_name)
  end
end
