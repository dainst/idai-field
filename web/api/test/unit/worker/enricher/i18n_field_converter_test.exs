defmodule Api.Worker.Enricher.I18NFieldConverterTest do

  use ExUnit.Case, async: true
  use Plug.Test
  alias Api.Worker.Enricher.I18NFieldConverter

  test "convert input, simpleInput, multiInput, simpleMultiInput" do
    change = %{
        doc: %{
          resource: %{
            category: %{
              name: "Trench"
            },
            inputField: "hallo",
            inputFieldMap: %{ "de" => "hallo-de" },
            simpleInputField: "hallo-simple-input",
            multiInputField: "hallo\nmulti",
            multiInputFieldMap: %{ "de" => "hallo-de\nmulti" },
            simpleMultiInputField: "hallo-simple\nmulti-input"
          }
        },
      }
    category_definition_groups =
      [
        %{
          fields: [
            %{ inputType: "input", name: "inputField" },
            %{ inputType: "input", name: "inputFieldMap" },
            %{ inputType: "simpleInput", name: "simpleInputField" },
            %{ inputType: "multiInput", name: "multiInputField" },
            %{ inputType: "multiInput", name: "multiInputFieldMap" },
            %{ inputType: "simpleMultiInput", name: "simpleMultiInputField" }
          ]
        }
      ]

    resource = (I18NFieldConverter.convert_category change, category_definition_groups).doc.resource

    assert %{ "unspecifiedLanguage" => "hallo" } == resource.inputField
    assert %{ "de" => "hallo-de" } == resource.inputFieldMap
    assert %{ "unspecifiedLanguage" => "hallo-simple-input" } == resource.simpleInputField
    assert %{ "unspecifiedLanguage" => "hallo\nmulti" } == resource.multiInputField
    assert %{ "de" => "hallo-de\nmulti" } == resource.multiInputFieldMap
    assert %{ "unspecifiedLanguage" => "hallo-simple\nmulti-input" } == resource.simpleMultiInputField
  end
end
