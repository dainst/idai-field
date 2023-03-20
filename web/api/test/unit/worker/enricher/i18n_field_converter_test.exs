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
            shortDescription: "hallo"
          }
        },
      }
    category_definition_groups =
      [
        %{
          fields: [
            %{
              inputType: "input",
              name: "shortDescription",
            }
          ]
        }
      ]

    result = (I18NFieldConverter.convert_category change, category_definition_groups).doc.resource.shortDescription
    assert %{ unspecifiedLanguage: "hallo" } == result
  end
end
