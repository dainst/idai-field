defmodule Api.Worker.Mapper do

  def process, do: fn change -> process(change) end
  def process(change = %{ doc: %{ resource: %{ category: "Project" }}}) do
    id = change.doc.resource.identifier
    change = put_in(change.doc.resource.id, id)
    put_in(change.id, id)
    |> rename_type_to_category
  end
  def process(change = %{ deleted: true }), do: change
  def process(change) do
    change
    |> rename_type_to_category
    |> convert_period
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
end
