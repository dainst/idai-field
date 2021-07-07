defmodule Api.Core.TreeTest do
  use ExUnit.Case
  use Plug.Test
  alias Api.Core.Tree

  test "find_in_tree_list" do
    tree_list = [
      %{
        item: 5,
        trees: []
      },
      %{
        item: 3,
        trees: []
      }
    ]

    result = Tree.find_in_tree_list(fn x -> x == 3 end, tree_list)
    assert result == 3
  end

  test "find_in_tree_list - recursive" do
    tree_list = [
      %{
        item: 5,
        trees: [
          %{
            item: 4,
            trees: []
          },
          %{
            item: 3,
            trees: []
          }
        ]
      }
    ]

    result = Tree.find_in_tree_list(fn x -> x == 3 end, tree_list)
    assert result == 3
  end

  test "find_in_tree_list - return nil if not found" do

    tree_list = [
      %{
        item: 1,
        trees: []
      },
      %{
        item: 2,
        trees: []
      }
    ]

    result = Tree.find_in_tree_list(fn x -> x == 3 end, tree_list)
    assert result == nil
  end

  test "filter_tree_list - filter on root level" do

    tree_list = [
      %{
        item: 1,
        trees: []
      },
      %{
        item: 2,
        trees: []
      }
    ]

    result = Tree.filter_tree_list(tree_list, fn x -> x == 1 end)
    assert result == [
       %{
         item: 1,
         trees: []
       }
     ]
  end

  test "filter_tree_list - filter child" do

    tree_list = [
      %{
        item: 1,
        trees: [
          %{
            item: 2,
            trees: []
          }
        ]
      }
    ]

    result = Tree.filter_tree_list(tree_list, fn x -> x == 1 end)
    assert result == [
       %{
         item: 1,
         trees: []
       }
     ]
  end

  test "filter_tree_list - keep parent if at least one child still exists after filtering" do

    tree_list = [
      %{
        item: 2,
        trees: [
          %{
            item: 1,
            trees: []
          }
        ]
      }
    ]

    result = Tree.filter_tree_list(tree_list, fn x -> x == 1 end)
    assert result == [
       %{
         item: 2,
         trees: [
           %{
             item: 1,
             trees: []
           }
         ]
       }
     ]
  end

  test "filter_tree_list - remove parent if no children exist after filtering and filter function returns false " do

    tree_list = [
      %{
        item: 2,
        trees: [
          %{
            item: 2,
            trees: []
          }
        ]
      }
    ]

    result = Tree.filter_tree_list(tree_list, fn x -> x == 1 end)
    assert result == []
  end

  test "map_tree_list" do

    tree_list = [
      %{
        item: 1,
        trees: [
          %{
            item: 2,
            trees: []
          }
        ]
      }
    ]

    result = Tree.map_tree_list(tree_list, fn x -> x * 2 end)
    assert result == [
       %{
         item: 2,
         trees: [
           %{
             item: 4,
             trees: []
           }
         ]
       }
     ]
  end

end
