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
    category_definition =
      %{
          groups: [
            %{
              fields: [
                %{
                  inputType: "input",
                  name: "shortDescription",
                }
              ]
            }
          ],
          name: "Trench",
      }
    result = (I18NFieldConverter.convert_category change, category_definition).doc.resource.shortDescription
    assert %{ unspecifiedLanguage: "hallo" } == result
  end
end
