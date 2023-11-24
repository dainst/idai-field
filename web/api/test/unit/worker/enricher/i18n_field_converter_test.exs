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
            legacyTextField: "hallo\ntext",
            textField: %{ "de" => "hallo-de\ntext" },
            legacyMultiInputField: ["a", "b"],
            multiInputField: [%{ "de" => "a" }, %{ "de" => "b" }],
            simpleMultiInputField: ["a", "b"]
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
            %{ inputType: "text", name: "legacyTextField" },
            %{ inputType: "text", name: "textField" },
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
    assert %{ "unspecifiedLanguage" => "hallo\ntext" } == resource.legacyTextField
    assert %{ "de" => "hallo-de\ntext" } == resource.textField
    assert [%{ "unspecifiedLanguage" => "a" }, %{ "unspecifiedLanguage" => "b" }] == resource.legacyMultiInputField
    assert [%{ "de" => "a" }, %{ "de" => "b" }] == resource.multiInputField
    assert [%{ "unspecifiedLanguage" => "a" }, %{ "unspecifiedLanguage" => "b" }] == resource.simpleMultiInputField
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

  test "convert composite field" do
    category_definition_groups =
      [
        %{
          fields: [
            %{
              inputType: "composite",
              name: "compositeField",
              subfields: [
                %{
                  inputType: "text",
                  name: "textSubfield"
                },
                %{
                  inputType: "text",
                  name: "legacyTextSubfield"
                }
              ]
            }
          ]
        }
      ]
    change = %{
        doc: %{
          resource: %{
            category: %{
              name: "Trench"
            },
            compositeField: [
              %{
                "textSubfield" => %{
                  "de" => "Beispiel",
                  "en" => "Example"
                },
                "legacyTextSubfield" => "Beispiel"
              }
            ]
          }
        },
      }

    resource = (I18NFieldConverter.convert_category change, category_definition_groups).doc.resource

    assert %{ "de" => "Beispiel", "en" => "Example" } == (List.first resource.compositeField)["textSubfield"]
    assert %{ "unspecifiedLanguage" => "Beispiel" } == (List.first resource.compositeField)["legacyTextSubfield"]
  end
end
