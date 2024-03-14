defmodule Api.Documents.FilterTest do
  alias Api.Documents.Filter
  alias Api.Core.ProjectConfigLoader
  use ExUnit.Case

  test "expand categories" do
    start_supervised({ProjectConfigLoader, {["default"]}})
    conf = ProjectConfigLoader.get("default")

    filters = [
      {"resource.category.name", ["Find"]},
      {"resource.category.name", ["Layer"]},
      {"project", ["test"]}
    ]

    expanded_filters = Filter.expand_categories(filters, conf)
    {_ , expanded_categories} = Enum.find(expanded_filters, fn {"resource.category.name", val} -> val end)

    subcategories = Enum.find(conf, &(&1.item.name == "Find"))
      |> (fn find -> Enum.map(find.trees, &(&1.item.name)) end).()

    assert Enum.all?(subcategories, &(&1 in expanded_categories))
  end

  test "preprocess multilanguage filters" do
    start_supervised({ProjectConfigLoader, {["default"]}})
    conf = ProjectConfigLoader.get("default")

    filters1 = [
      {"resource.category.name", "Find"},
      {"resource.category.name", "Layer"},
      {"resource.shortDescription", "abc"}
    ]

    # we won't split here because for splitting we expect exactly one category name filter
    assert {filters1, [], []} == Filter.split_off_multilanguage_filters_and_add_name_suffixes filters1, conf, ["de", "en"]

    filters2 = [
      {"resource.category.name", "Find"},
      {"resource.shortDescription", "abc"}
    ]

    assert {[{"resource.category.name", "Find"}],
            [[{"resource.shortDescription.de", "abc"},
              {"resource.shortDescription.en", "abc"},
              {"resource.shortDescription.unspecifiedLanguage", "abc"}]],
            ["resource.condition.name", "resource.conditionAmount.name"]} ==
                Filter.split_off_multilanguage_filters_and_add_name_suffixes filters2, conf, ["de", "en"]
  end
end
