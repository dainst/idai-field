defmodule Api.AppTest.SearchTest do
  @moduledoc """
  For these tests, when the api is queried,
  Api.Documents.MockIndexAdapter
  will provide the test data.
  """

  use ExUnit.Case, async: true
  use Plug.Test

  alias Api.AppTest.Support.AppTestHelper

  @api_path AppTestHelper.api_path
  @documents_path @api_path <> "/documents"

  @user1 {"user-1", "pass-1"}

  setup context do
   filters =if context[:category_selected] do
        ["project:a", "category:Operation"]
      else
        ["project:a"]
      end
    context
      |> put_in([:method], :post)
      |> put_in([:body], %{ filters: filters })
      |> AppTestHelper.perform_query
  end

  @tag path: @documents_path, login: @user1
  test "search", context do
    assert [
      %{
        project: "a",
        resource: %{
          category: %{name: "Operation"},
          grandparentId: nil,
          groups: [],
          id: "1",
          identifier: "ident1",
          parentId: nil
        }
      }
    ] == context.body.documents
    assert [
      %{
        label: %{de: "Kategorie", en: "Category"},
        name: "resource.category.name",
        values: [
          %{
            item: %{
              count: 1,
              value: %{
                groups: nil,
                label: %{de: "Maßnahme", en: "Operation"},
                name: "Operation"
              }
            },
            trees: []
          }
        ]
      }
    ] == context.body.filters
  end

  @tag path: @documents_path, login: @user1, category_selected: true
  test "search with category selected (when exactly one category selected, it will add groups to the filter value for that category)", context do
    assert ["stem", "parent", "dimension", "position"] == context.body.filters
      |> Enum.find(&(&1.name == "resource.category.name"))
      |> get_in([:values, Access.at(0), :item, :value, :groups])
      |> Enum.map(&(&1.name))
  end
end
