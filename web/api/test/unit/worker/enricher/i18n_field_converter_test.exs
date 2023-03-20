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
            a: "hallo",
            b: %{ "de" => "hallo-de" },
            c: "hallo-simple-input",
            d: "hallo\nmulti",
            e: %{ "de" => "hallo-de\nmulti" },
            f: "hallo-simple\nmulti-input"
          }
        },
      }
    category_definition_groups =
      [
        %{
          fields: [
            %{ inputType: "input", name: "a" },
            %{ inputType: "input", name: "b" },
            %{ inputType: "simpleInput", name: "c" },
            %{ inputType: "multiInput", name: "d" },
            %{ inputType: "multiInput", name: "e" },
            %{ inputType: "simpleMultiInput", name: "f" }
          ]
        }
      ]

    result = (I18NFieldConverter.convert_category change, category_definition_groups).doc.resource.a
    assert %{ "unspecifiedLanguage" => "hallo" } == result
    result = (I18NFieldConverter.convert_category change, category_definition_groups).doc.resource.b
    assert %{ "de" => "hallo-de" } == result
    result = (I18NFieldConverter.convert_category change, category_definition_groups).doc.resource.c
    assert %{ "unspecifiedLanguage" => "hallo-simple-input" } == result
    result = (I18NFieldConverter.convert_category change, category_definition_groups).doc.resource.d
    assert %{ "unspecifiedLanguage" => "hallo\nmulti" } == result
    result = (I18NFieldConverter.convert_category change, category_definition_groups).doc.resource.e
    assert %{ "de" => "hallo-de\nmulti" } == result
    result = (I18NFieldConverter.convert_category change, category_definition_groups).doc.resource.f
    assert %{ "unspecifiedLanguage" => "hallo-simple\nmulti-input" } == result
  end
end
