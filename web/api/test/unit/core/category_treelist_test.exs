defmodule Api.Core.CategoryTreeListTest do
  use ExUnit.Case
  use Plug.Test
  alias Api.Core.CategoryTreeList

  test "find_by_name" do
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
end
