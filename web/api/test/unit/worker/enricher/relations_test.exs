defmodule Api.Worker.Enricher.RelationsTest do
  use ExUnit.Case
  use Plug.Test
  alias Api.Worker.Enricher.Relations

  test "expand relations" do
    get =
      fn _ -> %{
                resource: %{
                  id: "1",
                  identifier: "i1",
                  shortDescription: %{ de: "Text" },
                  type: "Feature",
                  relations: %{
                    isRecordedIn: ["0"]
                  }
                }
              }
      end

    %{ doc: %{ resource: %{ relations: %{ isAbove: targets } }}} = Relations.expand(%{
      doc: %{
        resource: %{
          id: "2",
          identifier: "i2",
          type: "Feature",
          relations: %{
            isAbove: ["1"]
          }
        }
      }
    }, get)

    assert targets == [
      %{
        resource: %{
          category: "Feature",
          id: "1",
          identifier: "i1",
          shortDescription: %{ de: "Text" },
          parentId: "0"
        }
      }
    ]
  end

  test "convert shortDescription string in relation to i18n object when expanding relations" do
    get = fn _ -> %{
      resource: %{
        id: "1",
        identifier: "i1",
        shortDescription: "Text",
        type: "Feature",
        relations: %{
          isRecordedIn: ["0"]
        }
      }
    }
    end

    %{ doc: %{ resource: %{ relations: %{ isAbove: targets } }}} = Relations.expand(%{
      doc: %{
        resource: %{
          id: "2",
          identifier: "i2",
          type: "Feature",
          relations: %{
            isAbove: ["1"]
          }
        }
      }
    }, get)

    assert targets == [
      %{
        resource: %{
          category: "Feature",
          id: "1",
          identifier: "i1",
          shortDescription: %{ "unspecifiedLanguage" => "Text" },
          parentId: "0"
        }
      }
    ]
  end

  test "add child_of relation for resource with liesWithin relation" do
    %{ doc: %{ resource: %{ relations: relations } } } = Relations.add_child_of_relations(%{
      doc: %{
        resource: %{
          id: "1",
          identifier: "i1",
          type: "Feature",
          relations: %{
            liesWithin: ["2"]
          }
        }
      }
    })

    assert relations.isChildOf === ["2"]
    assert relations.liesWithin === ["2"]
  end

  test "add child_of relation for resource with isRecordedIn relation" do
    %{ doc: %{ resource: %{ relations: relations } } } = Relations.add_child_of_relations(%{
      doc: %{
        resource: %{
          id: "1",
          identifier: "i1",
          type: "Feature",
          relations: %{
            isRecordedIn: ["2"]
          }
        }
      }
    })

    assert relations.isChildOf === ["2"]
    assert relations.isRecordedIn === ["2"]
  end

  test "add child_of relation for resource with liesWithin & isRecordedIn relation" do
    %{ doc: %{ resource: %{ relations: relations } } } = Relations.add_child_of_relations(%{
      doc: %{
        resource: %{
          id: "1",
          identifier: "i1",
          type: "Feature",
          relations: %{
            isRecordedIn: ["2"],
            liesWithin: ["3"]
          }
        }
      }
    })

    assert relations.isChildOf === ["3"]
    assert relations.isRecordedIn === ["2"]
    assert relations.liesWithin === ["3"]
  end

  test "do not add child_of relation for resource without liesWithin & isRecordedIn relation" do
    %{ doc: %{ resource: %{ relations: relations } } } = Relations.add_child_of_relations(%{
      doc: %{
        resource: %{
          id: "1",
          identifier: "i1",
          type: "Feature",
          relations: %{
            isAbove: ["2"]
          }
        }
      }
    })

    assert !Map.has_key?(relations, :isChildOf)
    assert relations.isAbove === ["2"]
  end
end
