defmodule Api.Core.ProjectConfigLoaderTest do
    use ExUnit.Case, async: true
    use Plug.Test

  test "load config for project" do
    start_supervised({Api.Core.ProjectConfigLoader, {["test-project"]}})
    config = Api.Core.ProjectConfigLoader.get("test-project")
    assert List.first(config).item.label.de == "Maßnahme"
  end
end
