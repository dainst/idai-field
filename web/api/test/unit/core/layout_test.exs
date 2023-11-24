defmodule Api.Core.LayoutTest do
  use ExUnit.Case, async: true
  use Plug.Test
  alias Api.Core.Layout

  test "map object" do

    resource = %{
      :id => "42",
      :relations => %{
        liesWithin: [%{ resource: %{ id: "45", parentId: "40" } }],
        isChildOf: [%{ resource: %{ id: "45", parentId: "40" } }]
      },
      :category => %{ "name" => "Operation", "label" => %{ "de" => "Maßnahme", "en" => "Operation" } },
      "color" => [
        %{ "name" => "Grün", "label" => %{ "de" => "Grün", "en" => "Green" } },
        %{ "name" => "Blau", "label" => %{ "de" => "Blau", "en" => "Blue" } }
      ],
      "width" => [
        %{
          "inputValue" => 10,
          "inputUnit" => "cm",
          "measurementPosition" => %{
            "name" => "Maximale Ausdehnung",
            "label" => %{
              "de" => "Maximale Ausdehnung",
              "en" => "Maximum expansion"
            }
          }
        }
      ]
    }

    project_resource = %{ license: "Test-Lizenz" }

    start_supervised({Api.Core.ProjectConfigLoader, {["test-project"]}})
    configuration = Api.Core.ProjectConfigLoader.get("test-project")

    layouted_resource = Layout.to_layouted_resource(configuration, resource, project_resource)

    assert layouted_resource == %{
      :id => "42",
      :category => %{ label: %{ de: "Maßnahme", en: "Operation" }, name: "Operation" },
      :parentId => "45",
      :grandparentId => "40",
      :license => "Test-Lizenz",
      :relations => %{
        liesWithin: [%{ resource: %{ id: "45", parentId: "40" } }],
        isChildOf: [%{ resource: %{ id: "45", parentId: "40" } }]
      },
      :groups => [%{
        name: "stem",
        fields: [
           %{
            name: "category",
            value: %{ name: "Operation", label: %{ de: "Maßnahme", en: "Operation" } },
            label: %{
              de: "Kategorie",
              en: "Category"
            },
            description: %{
              de: "Typ der Ressource",
              en: "Type of resource"
            },
            inputType: "category"
           },
           %{
             name: "id",
             value: "42",
             label: %{},
             inputType: "input",
             description: %{}
           },
           %{
              name: "color",
              value: [
                %{
                  name: "Grün",
                  label: %{
                    de: "Grün",
                    en: "Green"
                  }
                },
                %{
                  name: "Blau",
                  label: %{
                    de: "Blau",
                    en: "Blue"
                  }
                }
              ],
              label: %{
                de: "Farbe",
                en: "Color"
              },
              description: %{},
              inputType: "checkboxes"
           },
           %{
              name: "liesWithin",
              targets: [%{ resource: %{ id: "45", parentId: "40" } }],
              label: %{
                de: "Liegt in",
                en: "Lies within"
              },
              description: %{},
              inputType: "relation"
          }
        ]
       },
       %{
         name: "dimensions",
         fields: [
           %{
             name: "width",
             value: [
               %{
                 inputValue: 10,
                 inputUnit: "cm",
                 measurementPosition: %{
                   name: "Maximale Ausdehnung",
                   label: %{
                     de: "Maximale Ausdehnung",
                     en: "Maximum expansion"
                   }
                 }
               }
             ],
             label: %{
               de: "Breite",
               en: "Width"
             },
             description: %{},
             inputType: "dimension"
           }
         ]
       },
      %{
        name: "time",
        fields: []
      }
     ]
    }
  end
end
