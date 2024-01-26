defmodule Api.Worker.Enricher.ChildrenTest do
  use ExUnit.Case
  use Plug.Test
  alias Api.Worker.Enricher.Children

  test "add children count" do

    changes = [
      %{
        doc: %{
          resource: %{
            id: "1",
            identifier: "i1",
            category: "Trench",
            relations: %{}
          }
        }
      },
      %{
        doc: %{
          resource: %{
            id: "2",
            identifier: "i2",
            category: "Feature",
            relations: %{
              isChildOf: [%{ resource: %{ id: "1" } }]
            }
          }
        }
      },
      %{
        doc: %{
          resource: %{
            id: "3",
            identifier: "i3",
            category: "Feature",
            relations: %{
              isChildOf: [%{ resource: %{ id: "1" } }]
            }
          }
        }
      },
      %{
        doc: %{
          resource: %{
            id: "4",
            identifier: "i4",
            category: "Find",
            relations: %{
              isChildOf: [%{ resource: %{ id: "3" } }]
            }
          }
        }
      }
    ]

    result = Children.add_children_counts(changes)
    assert Enum.at(result, 0).doc.resource.childrenCount == 2
    assert Enum.at(result, 1).doc.resource.childrenCount == 0
    assert Enum.at(result, 2).doc.resource.childrenCount == 1
    assert Enum.at(result, 3).doc.resource.childrenCount == 0
  end
end
