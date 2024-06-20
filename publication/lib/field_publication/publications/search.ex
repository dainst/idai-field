defmodule FieldPublication.Publications.Search do
  alias FieldPublication.OpensearchService

  def general_search(q, from \\ 0, size \\ 10) do
    result =
      OpensearchService.run_search(%{
        query: %{
          query_string: %{
            query: q
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

    result
  end
end
