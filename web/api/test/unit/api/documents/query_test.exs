defmodule Api.Documents.QueryTest do
  alias Api.Documents.Query
  use ExUnit.Case

  test "add filters" do
    result = 
      Query.init("*", 100, 0)
      |> Query.add_filters([{"abc", "def"}])
      |> Query.add_should_filters([{"ghi", "jkl"}, {"mno", "pqr"}])

    assert [
      %{terms: %{"abc" => "def"}} |
      %{
        bool: %{
          should: [
            %{match: %{"ghi" => "jkl"}},
            %{match: %{"mno" => "pqr"}}
          ]
        }
      }] == result.query.script_score.query.bool.filter
  end
end