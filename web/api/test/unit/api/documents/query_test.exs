defmodule Api.Documents.QueryTest do
  alias Api.Documents.Query
  use ExUnit.Case

  test "add filters" do
    result = 
      Query.init("*", 100, 0)
      |> Query.add_filters([{"abc", "def"}])
      |> Query.add_should_filters([[{"ghi", "jkl"}, 
                                    {"mno", "pqr"}],
                                   [{"stu", "vwx"}, 
                                    {"yza", "bcd"}]])

    assert [
      %{terms: %{"abc" => "def"}},
      %{
        bool: %{
          should: [
            %{match: %{"ghi" => "jkl"}},
            %{match: %{"mno" => "pqr"}}
          ]
        }
      },
      %{
        bool: %{
          should: [
            %{match: %{"stu" => "vwx"}},
            %{match: %{"yza" => "bcd"}}
          ]
        }
      }] == result.query.script_score.query.bool.filter
  end
end