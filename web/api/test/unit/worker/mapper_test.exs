defmodule Api.Worker.MapperTest do

  alias Api.Worker.Mapper

  use ExUnit.Case
  use Plug.Test

  test "convert type to category" do
    start_supervised({Api.Core.ProjectConfigLoader, {["test-project"]}})
    configuration = Api.Core.ProjectConfigLoader.get("test-project")

    change = %{ doc: %{ resource: %{ type: "Operation" }}}
    %{ doc: %{ resource: resource }} = Mapper.process(change, configuration)

    assert resource[:type] == nil
    assert resource.category == "Operation"
  end

  test "convert Project category document" do
    change = %{ id: "?", doc: %{ resource: %{
      type: "Project",
      identifier: "Proj-A",
      id: "id-A"
    }}}
    %{id: change_id, doc: %{ resource: resource }} = change
      |> Mapper.rename_type_to_category
      |> Mapper.process(nil)

    assert resource.category == "Project"
    assert resource.id == "Proj-A"
    assert change_id == "Proj-A"
  end

  test "leave deletion unchanged" do
    change = %{ deleted: true }
    result = Mapper.process(change, nil)

    assert result == %{ deleted: true }
  end

  test "convert old style period field - period is string" do
    start_supervised({Api.Core.ProjectConfigLoader, {["test-project"]}})
    configuration = Api.Core.ProjectConfigLoader.get("test-project")

    change = %{ doc: %{ resource: %{
      :type => "Operation",
      "period" => "start"
    }}}
    %{ doc: %{ resource: resource }} = Mapper.process(change, configuration)

    assert resource["period"] == %{ "value" => "start" }
  end

  test "convert old style period field - period and periodEnd as strings" do
    start_supervised({Api.Core.ProjectConfigLoader, {["test-project"]}})
    configuration = Api.Core.ProjectConfigLoader.get("test-project")

    change = %{ doc: %{ resource: %{
      :type => "Operation",
      "period" => "start",
      "periodEnd" => "end"
    }}}
    %{ doc: %{ resource: resource }} = Mapper.process(change, configuration)

    assert resource["periodEnd"] == nil
    assert resource["period"] == %{ "value" => "start", "endValue" => "end" }
  end

  test "new style period field - leave unchanged" do
    start_supervised({Api.Core.ProjectConfigLoader, {["test-project"]}})
    configuration = Api.Core.ProjectConfigLoader.get("test-project")

    change = %{ doc: %{ resource: %{
      :type => "Operation",
      "period" => %{
        "value" => "start",
        "endValue" => "end"
      }
    }}}
    %{ doc: %{ resource: resource }} = Mapper.process(change, configuration)

    assert resource["period"] == %{ "value" => "start", "endValue" => "end" }
  end

  test "convert dating type" do
    start_supervised({Api.Core.ProjectConfigLoader, {["test-project"]}})
    configuration = Api.Core.ProjectConfigLoader.get("test-project")

    change = %{ doc: %{ resource: %{
        :type => "Operation",
        "dating" => [%{
          "type" => "exact",
          "end" => %{
            "year" => -1,
            "inputYear" => 1,
            "inputType" => "bce"
          }
        }]
    } } }
    %{ doc: %{ resource: resource }} = Mapper.process(change, configuration)

    assert Enum.at(resource["dating"], 0) == %{
      "type" => "single",
      "end" => %{
        "year" => -1,
        "inputYear" => 1,
        "inputType" => "bce"
      }
    }
  end
end
