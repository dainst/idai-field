defmodule Api.Worker.Enricher.Preprocess do

  def add_sort_field(change = %{ doc: %{ resource: %{ identifier: identifier }}}) do
    put_in(change, [:doc, :sort], add_leading_zeroes(identifier))
  end

  defp add_leading_zeroes(string) do
    String.split(string, ~r/\d+/, include_captures: true)
    |> Enum.map(&add_leading_zeroes_to_token/1)
    |> Enum.join
  end

  defp add_leading_zeroes_to_token(token) do
    if String.match?(token, ~r/\d+/), do: String.pad_leading(token, 9, "0"), else: token
  end
end
