defmodule FieldPublication.Publications.Search do
  alias FieldPublication.OpensearchService

  def fuzzy_search(q, from \\ 0, size \\ 10)

  def fuzzy_search(q, from, size) when q != "" and q != "*" do
    OpensearchService.run_search(%{
      query: %{
        query_string: %{
          query: "#{q}~"
        }
      },
      from: from,
      size: size
    })
    |> case do
      {:ok, %{status: 200, body: body}} ->
        body = Jason.decode!(body)

        body["hits"]["hits"]
        |> Enum.map(fn %{"_source" => doc} ->
          doc
        end)
    end
  end

  def fuzzy_search(_, _, _) do
    []
  end
end
