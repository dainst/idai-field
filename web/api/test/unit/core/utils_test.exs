defmodule Api.Core.UtilsTest do
  use ExUnit.Case
  import Api.Core.Utils
  
  test "base case" do
    assert atomize(%{ "a" => "b" }) == %{ a: "b" }
  end

  test "base case - is recursive by default" do
    assert atomize(%{ "a" => %{ "d" => "e" }}) == %{ a: %{ d: "e" } }
  end

  test "exclusions" do
    result = atomize(%{ "a" => "b", "c" => "d" }, [:c])
    assert result == %{ :a => "b", "c" => "d" }
  end

  test "exclusions - recursive case" do
    result = atomize(%{ "a" => %{ "c" => "d", "b" => "m" }}, [:c])
    assert result == %{ :a => %{ "c" => "d", :b => "m" } }
  end

  test "inclusions" do
    result = atomize(%{ "a" => "b", "c" => "d" }, [:a], true)
    assert result == %{ :a => "b", "c" => "d" }
    assert result.a == "b"
  end

  test "pass list" do
    result = atomize([%{ "a" => "d", "b" => "m" }])
    assert result == [%{ :a => "d", :b => "m" }]
  end

  test "pass list, explicit exclusion" do
    result = atomize([%{ "a" => "d", "b" => "m" }], [:b])
    assert result == [%{ :a => "d", "b" => "m" }]
  end

  test "exclusions - recursive case, with lists" do
    result = atomize(%{ "a" => [%{ "a" => "d", "b" => "m" }]}, [:b])
    assert result == %{ :a => [%{ :a => "d", "b" => "m" }] }
  end

  test "map contains already atomized key" do
    result = atomize(%{ a: "b"}, [:a], true)
    assert result == %{ a: "b" }
  end

  test "up to" do
    result = atomize_up_to(%{ "a" => %{ "b" => "c" }}, :a)
    assert result == %{ a: %{ "b" => "c" } }

    result = atomize_up_to(%{ "a" => %{ "b" => %{ "c" => "d" } }}, :b)
    assert result == %{ a: %{ b: %{ "c" => "d" }} }

    result = atomize_up_to(%{ "a" => 3 }, :a)
    assert result == %{ a: 3 }

    result = atomize_up_to(%{ "a" => 3 }, :b)
    assert result == %{ a: 3 }
  end

  test "up to - with arrays" do
    result = atomize_up_to([%{ "a" => %{ "b" => "c" }}], :a)
    assert result == [%{ a: %{ "b" => "c" } }]

    result = atomize_up_to(%{ "a" => [%{ "b" => %{ "c" => "d" } }]}, :b)
    assert result == %{ a: [%{ b: %{ "c" => "d" }}] }

    result = atomize_up_to(%{ "a" => [3] }, :a)
    assert result == %{ a: [3] }

    result = atomize_up_to(%{ "a" => [3] }, :b)
    assert result == %{ a: [3] }
  end
end
