defmodule Api.Worker.Enricher.I18NFieldConverterTest do

  use ExUnit.Case, async: true
  use Plug.Test
  alias Api.Worker.Enricher.I18NFieldConverter

  test "convert" do
    change = %{
        doc: %{
          resource: %{
            category: %{
              name: "Trench"
            },
            a: "hallo",
            b: %{ "de": "hallo-de"}
          }
        },
      }
    category_definition_groups =
      [
        %{
          fields: [
            %{
              inputType: "input",
              name: "a",
            },
            %{
              inputType: "input",
              name: "b",
            }
          ]
        }
      ]

    result = (I18NFieldConverter.convert_category change, category_definition_groups).doc.resource.a
    assert %{ unspecifiedLanguage: "hallo" } == result
    result = (I18NFieldConverter.convert_category change, category_definition_groups).doc.resource.b
    assert %{ "de": "hallo-de" } == result
  end
end
