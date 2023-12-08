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
   filters =if context[:selected_category] do
        ["project:a", "category:" <> context.selected_category]
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
  end

  @tag path: @documents_path, login: @user1
  test "filters - search with no category selected", context do
    assert nil == get_bucket(context, "Operation")
      |> get_in([:item, :value, :groups])
    assert nil == get_bucket(context, "Find")
      |> get_in([:item, :value, :groups])
  end

  @tag path: @documents_path, login: @user1, selected_category: "Operation"
  test "filters - search with category selected (when exactly one category selected, it will add groups to the filter value for that category)", context do
    assert ["stem", "parent", "dimension", "position"] == get_bucket(context, "Operation")
      |> get_in([:item, :value, :groups])
      |> Enum.map(&(&1.name))
    assert nil == get_bucket(context, "Find")
      |> get_in([:item, :value, :groups])
  end

  defp get_bucket context, category do
    context.body.filters
      |> Enum.find(&(&1.name == "resource.category.name"))
      |> get_in([:values])
      |> Enum.find(&(category == &1.item.value.name))
  end
end
