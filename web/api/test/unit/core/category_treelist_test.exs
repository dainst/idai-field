defmodule Api.Core.CategoryTreeListTest do
  use ExUnit.Case
  use Plug.Test
  alias Api.Core.CategoryTreeList

  test "find by name" do
    category_tree_list = [
      %{
        item: %{ name: "a" },
        trees: []
      },
      %{
        item: %{ name: "b" },
        trees: []
      }
    ]

    result = CategoryTreeList.find_by_name("b", category_tree_list)
    assert result == %{ name: "b" }
  end

  test "get supercategory" do
    category_tree_list = [
      %{
        item: %{ name: "a" },
        trees: [
          %{
            item: %{ name: "a1" },
            trees: []
          },
          %{
            item: %{ name: "a2" },
            trees: []
          }
        ]
      },
      %{
        item: %{ name: "b" },
        trees: [
          %{
            item: %{ name: "b1" },
            trees: []
          },
          %{
            item: %{ name: "b2" },
            trees: []
          }
        ]
      }
    ]

    result = CategoryTreeList.get_supercategory("b2", category_tree_list)
    assert result == %{ name: "b" }
    result = CategoryTreeList.get_supercategory("b3", category_tree_list)
    assert is_nil(result)
  end
end
