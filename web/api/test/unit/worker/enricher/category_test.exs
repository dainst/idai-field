defmodule Api.Worker.Enricher.CategoryTest do
  use ExUnit.Case, async: true
  use Plug.Test
  alias Api.Worker.Enricher.Category

  test "add supercategory name" do
    document = %{
      resource: %{
        id: "1",
        identifier: "1",
        category: %{ name: "Trench", label: %{ de: "Schnitt" } },
        relations: %{}
      }
    }

    start_supervised({ Api.Core.ProjectConfigLoader, { ["test-project"] } })
    configuration = Api.Core.ProjectConfigLoader.get("test-project")

    %{ doc: %{ resource: %{ category: category } } } = Category.add_supercategory_name(
      %{ doc: document }, configuration
    )

    assert category == %{ name: "Trench", label: %{ de: "Schnitt" }, parent: "Operation" }
  end

  test "do not add supercategory name if the category is a supercategory itself" do
    document = %{
      resource: %{
        id: "1",
        identifier: "1",
        category: %{ name: "Operation", label: %{ de: "Maßnahme" } },
        relations: %{}
      }
    }

    start_supervised({ Api.Core.ProjectConfigLoader, { ["test-project"] } })
    configuration = Api.Core.ProjectConfigLoader.get("test-project")

    %{ doc: %{ resource: %{ category: category } } } = Category.add_supercategory_name(
      %{ doc: document }, configuration
    )

    assert category == %{ name: "Operation", label: %{ de: "Maßnahme" } }
  end

  test "add supercategory name to relation target" do
    document = %{
      resource: %{
        id: "1",
        identifier: "1",
        category: %{ name: "Trench", label: %{ de: "Schnitt" } },
        relations: %{
          exampleRelation: [
            %{
              resource: %{
                id: "2",
                identifier: "2",
                category: %{ name: "Trench", label: %{ de: "Schnitt" } }
              }
            }
          ]
        }
      }
    }

    start_supervised({ Api.Core.ProjectConfigLoader, { ["test-project"] } })
    configuration = Api.Core.ProjectConfigLoader.get("test-project")

    %{ doc: %{ resource: %{ relations: %{ exampleRelation: relationTargets } } } }
      = Category.add_supercategory_name(%{ doc: document }, configuration)

    assert Enum.at(relationTargets, 0).resource.category
      == %{ name: "Trench", label: %{ de: "Schnitt" }, parent: "Operation" }
  end
end
