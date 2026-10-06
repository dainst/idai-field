defmodule NaturalSort do
  @moduledoc """
  Sort a list naturally.

  Sort functions will not, generally, sort strings containing
  numbers the same way a human would.

  Given a list:

      ["a10",  "a05c",  "a1",  "a",  "a2",  "a1a",  "a0",  "a1b",  "a20"]

  Applying standard sort will produce

      ["a", "a0", "a05c", "a1", "a10", "a1a", "a1b", "a2", "a20"]

  But applying a natural sort will give:

      ["a", "a0", "a1", "a1a", "a1b", "a2", "a05c", "a10", "a20"]

  ## Prior art:

  [VersionEye's naturalsorter gem](https://github.com/versioneye/naturalsorter)
  was the inspiration, with that being based on
  [Martin Pool's natural sorting algorithm](http://sourcefrog.net/projects/natsort/),
  making direct use of the Ruby implementation of the original
  C version.

  Elixir's [Version](https://github.com/elixir-lang/elixir/blob/v1.0.4/lib/elixir/lib/version.ex#L1) module does a similar thing.
  """

  @doc """
  Sorts a list of strings. This works by leveraging Elixir's
  `Enum.sort_by/3` function, which takes as the second argument
  a mapping function. Each string is converted into a list
  of strings and integers. Once in this form, applying the
  sort function results in a correctly sorted list.

  ## Options

  There are currently two available options (passed as a
  keyword list), `:direction` and `case_sensitive`.

  * `:direction` may have a value of `:asc` or `:desc`, and
    defaults to `:asc`.
  * `:case_sensitive` may be `true` or `false`, and defaults
    to `false`.


  ## Examples

      iex> NaturalSort.sort(["x2-y7", "x8-y8", "x2-y08", "x2-g8" ])
      ["x2-g8", "x2-y7", "x2-y08", "x8-y8" ]

      iex> NaturalSort.sort(["a5", "a400", "a1"], direction: :desc)
      ["a400", "a5", "a1"]

      iex> NaturalSort.sort(["foo03.z", "foo45.D", "foo06.a", "foo06.A", "foo"], case_sensitive: :true)
      ["foo", "foo03.z", "foo06.A", "foo06.a", "foo45.D"]

      iex> NaturalSort.sort(["foo03.z", "foo45.D", "foo06.a", "foo06.A", "foo"], [case_sensitive: :true, direction: :desc])
      ["foo45.D", "foo06.a", "foo06.A", "foo03.z", "foo"]
  """

  def sort([]), do: []

  def sort(list, options \\ []) do
    direction = Keyword.get(options, :direction, :asc)
    case_sensitive? = Keyword.get(options, :case_sensitive, false)

    Enum.sort_by(
      list,
      fn x -> format_item(x, case_sensitive?) end,
      sort_direction(direction)
    )
  end

  ##################################################
  # String -> List formatter

  defp format_item(item, case_sensitive?) when is_number(item), do: item

  defp format_item(item, case_sensitive?) do
    item
    |> format_case(case_sensitive?)
    # NOTE uses [relatively slow] unicode flag in regex.
    |> string_scan(~r/(\p{Nd}+)|(\p{L}+)/u)
    |> List.flatten()
    |> Enum.map(fn item -> convert_integers(item) end)
  end

  defp convert_integers(string) do
    # NOTE uses [relatively slow] unicode flag in regex.
    case Regex.match?(~r/\p{Nd}+/u, string) do
      true -> String.to_integer(string)
      false -> string
    end
  end

  defp string_scan(string, regex), do: Regex.scan(regex, string, capture: :all_but_first)

  ##################################################
  # Options

  defp sort_direction(dir) do
    case dir do
      :asc -> &<=/2
      :desc -> &>=/2
    end
  end

  defp format_case(item, case_sensitive?) do
    case case_sensitive? do
      true -> item
      false -> String.downcase(item)
    end
  end

  ##################################################
end
