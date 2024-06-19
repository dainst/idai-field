defmodule FieldPublication.Publications.Search do
  alias FieldPublication.Publications
  alias FieldPublication.OpensearchService

  def general_search(query_string, from \\ 0, size \\ 10) do
    result =
      OpensearchService.run_search(%{
        query: %{bool: %{must: %{query_string: %{query: query_string}}}},
        from: from,
        size: size
      })
      |> case do
        {:ok, %{status: 200, body: body}} ->
          body = Jason.decode!(body)

          body["hits"]["hits"]
          |> Enum.map(fn %{"_index" => index, "_source" => doc} ->
            {:ok, publication} = OpensearchService.index_name_to_publication(index)

            %{
              publication_id: Publications.get_doc_id(publication),
              doc: doc
            }
          end)
      end

    result
  end
end
