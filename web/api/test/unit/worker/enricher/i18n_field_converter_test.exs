defmodule Api.Worker.Enricher.I18NFieldConverterTest do

  use ExUnit.Case, async: true
  use Plug.Test
  alias Api.Worker.Enricher.I18NFieldConverter

  test "convert" do
    change = %{
        doc: %{
          created: %{date: "2023-03-20T14:05:41.836Z", user: "anonymous"},
          modified: [%{date: "2023-03-20T14:06:33.138Z", user: "anonymous"}],
          project: "devtest-daniel-de-en",
          resource: %{
            category: %{
              name: "Trench"
            },
            id: "511b8275-01db-4668-bb96-3217a80c6143",
            identifier: "one-trench",
            # shortDescription: %{de: "Ein Schnitt", en: "A Trench"},
            shortDescription: "hallo",
            spatialLocation: %{de: "Irgendwo", en: "Somewhere"}
          },
          sort: "one-trench"
        },
        id: "511b8275-01db-4668-bb96-3217a80c6143",
        key: "511b8275-01db-4668-bb96-3217a80c6143",
        value: %{rev: "2-4fe825a312474b9c93778af5afbe6bdd"}
      }
  category_definition =
    %{
        groups: [
          %{
            fields: [
              %{
                inputType: "input",
                name: "shortDescription",
                selectable: true,
                visible: true
              },
              %{
                editable: true,
                inputType: "input",
                name: "spatialLocation",
                selectable: true,
                source: "common",
                visible: true
              }
            ],
            name: "stem"
          }
        ],
        isAbstract: false,
        libraryId: "Trench",
        name: "Trench",
        required: false,
        source: "builtIn",
        userDefinedSubcategoriesAllowed: false
    }
    result = (I18NFieldConverter.convert_category change, category_definition).doc.resource.shortDescription
    assert %{ unspecifiedLanguage: "hallo" } == result
  end
end
