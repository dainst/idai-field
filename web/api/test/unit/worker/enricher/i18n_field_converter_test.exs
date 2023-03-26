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
            legacyInputField: "hallo",
            inputField: %{ "de" => "hallo-de" },
            simpleInputField: "hallo-simple-input",
            legacyMultiInputField: "hallo\nmulti",
            multiInputField: %{ "de" => "hallo-de\nmulti" },
            simpleMultiInputField: "hallo-simple\nmulti-input"
          }
        },
      }
    category_definition_groups =
      [
        %{
          fields: [
            %{ inputType: "input", name: "legacyInputField" },
            %{ inputType: "input", name: "inputField" },
            %{ inputType: "simpleInput", name: "simpleInputField" },
            %{ inputType: "multiInput", name: "legacyMultiInputField" },
            %{ inputType: "multiInput", name: "multiInputField" },
            %{ inputType: "simpleMultiInput", name: "simpleMultiInputField" }
          ]
        }
      ]

    resource = (I18NFieldConverter.convert_category change, category_definition_groups).doc.resource

    assert %{ "unspecifiedLanguage" => "hallo" } == resource.legacyInputField
    assert %{ "de" => "hallo-de" } == resource.inputField
    assert %{ "unspecifiedLanguage" => "hallo-simple-input" } == resource.simpleInputField
    assert %{ "unspecifiedLanguage" => "hallo\nmulti" } == resource.legacyMultiInputField
    assert %{ "de" => "hallo-de\nmulti" } == resource.multiInputField
    assert %{ "unspecifiedLanguage" => "hallo-simple\nmulti-input" } == resource.simpleMultiInputField
  end

  test "convert dating" do
    category_definition_groups =
      [
        %{
          fields: [
            %{ inputType: "dating", name: "datingField" },
            %{ inputType: "dating", name: "legacyDatingField" },
          ]
        }
      ]
    change = %{
        doc: %{
          resource: %{
            category: %{
              name: "Trench"
            },
            datingField: [%{
              source: %{de: "Eine Datierung", en: "A Dating"}
            }],
            legacyDatingField: [%{
              source: "Eine Datierung"
            }]
          }
        },
      }

    resource = (I18NFieldConverter.convert_category change, category_definition_groups).doc.resource

    assert %{ de: "Eine Datierung", en: "A Dating" } == (List.first resource.datingField).source
    assert %{ unspecifiedLanguage: "Eine Datierung" } == (List.first resource.legacyDatingField).source
  end

  test "convert dimension" do
    category_definition_groups =
      [
        %{
          fields: [
            %{ inputType: "dimension", name: "dimensionField" },
            %{ inputType: "dimension", name: "legacyDimensionField" },
          ]
        }
      ]
    change = %{
        doc: %{
          resource: %{
            category: %{
              name: "Trench"
            },
            dimensionField: [%{
              measurementComment: %{de: "Eine Abmessung", en: "A dimension"}
            }],
            legacyDimensionField: [%{
              measurementComment: "Eine Abmessung"
            }]
          }
        },
      }

    resource = (I18NFieldConverter.convert_category change, category_definition_groups).doc.resource

    assert %{ de: "Eine Abmessung", en: "A dimension" } == (List.first resource.dimensionField).measurementComment
    assert %{ unspecifiedLanguage: "Eine Abmessung" } == (List.first resource.legacyDimensionField).measurementComment
  end
end
