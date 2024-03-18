defmodule Api.Core.CorePropertiesAtomizingTest do
  use ExUnit.Case, async: true
  use Plug.Test
  import Api.Core.CorePropertiesAtomizing

  test "base case" do
    result = format_document(%{ "resource" => %{ "category" => "Operation" }})
    assert result.resource.category == "Operation"
  end

  test "changes" do
    result = List.first(format_changes([%{ "changes" => 1, "doc" => %{ "resource" => %{ "category" => "Operation" }}}]))
    assert result.doc.resource.category == "Operation"
  end

  test "hierarchical" do
    result = format_document(
      %{
        "resource" => %{
          "category" => "Operation",
          "unknownField" => "V",
          "relations" => %{
            "liesWithin" => [%{ "resource" => %{ "category" => "Find", "unknownField" => "V" }}],
            "isRecordedIn" => [%{ "resource" => %{ "category" => "Find", "unknownField" => "V" }}]
          }
        }
      })
    assert result.resource["unknownField"] == "V"
    assert List.first(result.resource.relations.liesWithin).resource.category == "Find"
    assert List.first(result.resource.relations.liesWithin).resource["unknownField"] == "V"
  end
end
