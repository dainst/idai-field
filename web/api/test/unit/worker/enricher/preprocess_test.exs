defmodule Api.Worker.Enricher.PreprocessTest do
  use ExUnit.Case, async: true
  alias Api.Worker.Enricher.Preprocess

  test "add sort field" do

    changes = [
      %{ :doc => %{ :resource => %{ :identifier => "ABC" } } },
      %{ :doc => %{ :resource => %{ :identifier => "1000" } } },
      %{ :doc => %{ :resource => %{ :identifier => "1027-3" } } },
      %{ :doc => %{ :resource => %{ :identifier => "WESid_126_11" } } }
    ]

    result = Enum.map(changes, &Preprocess.add_sort_field/1)

    assert [
      %{ :doc => %{ :resource => %{ :identifier => "ABC" }, :sort => "ABC" } },
      %{ :doc => %{ :resource => %{ :identifier => "1000" }, :sort => "000001000" } },
      %{ :doc => %{ :resource => %{ :identifier => "1027-3" }, :sort => "000001027-000000003" } },
      %{ :doc => %{ :resource => %{ :identifier => "WESid_126_11"}, :sort => "WESid_000000126_000000011" } }
    ] == result
  end

end
