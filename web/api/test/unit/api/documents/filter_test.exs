defmodule Api.Documents.FilterTest do
  alias Api.Documents.Filter
  alias Api.Core.ProjectConfigLoader
  use ExUnit.Case

  test "expand" do
    start_supervised({ProjectConfigLoader, {"resources/projects", ["default"]}})
    conf = ProjectConfigLoader.get("default")

    filters = [
      {"resource.category.name", ["Find"]},
      {"resource.category.name", ["Layer"]},
      {"project", ["test"]}
    ]

    expanded_filters = Filter.expand(filters, conf)
    {_ , expanded_categories} = Enum.find(expanded_filters, fn {"resource.category.name", val} -> val end)

    subcategories = Enum.find(conf, &(&1.item.name == "Find"))
      |> (fn find -> Enum.map(find.trees, &(&1.item.name)) end).()

    assert Enum.all?(subcategories, &(&1 in expanded_categories))
  end
end
