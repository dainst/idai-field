defmodule Api.Core.ProjectConfigTest do
  use ExUnit.Case, async: true
  alias Api.Core.ProjectConfig

  test "get label" do
    start_supervised({Api.Core.ProjectConfigLoader, {["test-project"]}})
    configuration = Api.Core.ProjectConfigLoader.get("test-project")

    label = ProjectConfig.get_label(configuration, "Operation", "category")
    assert label == %{ en: "Category", de: "Kategorie"}

    label = ProjectConfig.get_label(configuration, "Operation", "width")
    assert label == %{ en: "Width", de: "Breite"}
  end
end
