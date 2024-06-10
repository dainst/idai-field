defmodule FieldPublication.Publications.Search do
  alias FieldPublication.DataServices.OpensearchService

  def general_search(query_string, from \\ 0, size \\ 10) do
    result =
      OpensearchService.run_search(
        "publication_*",
        %{
          query: %{bool: %{must: %{query_string: %{query: query_string}}}},
          from: from,
          size: size
        }
      )
      |> case do
        {:ok, %{status: 200, body: body}} ->
          body = Jason.decode!(body)

          body["hits"]["hits"]
          |> Enum.map(fn %{"_index" => index, "_source" => doc} ->
            publication_id = publication_id_from_index(index)

            %{
              publication_id: publication_id,
              doc: doc
            }
          end)
      end

    result
  end

  defp publication_id_from_index(index_name) do
    index_name
    |> String.replace_suffix("__a__", "")
    |> String.replace_suffix("__b__", "")
  end
end
