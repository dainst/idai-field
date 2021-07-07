defmodule Api.Documents.Predecessors do
    alias Api.Documents.Index

    def get(doc), do: fetch_entries(doc) |> Enum.reverse()

    defp fetch_entries(nil), do: []
    defp fetch_entries(doc) do
        Stream.unfold(doc, fn
          nil -> nil
          current_doc -> {
            current_doc,
            if Map.has_key?(current_doc.resource, :parentId) && current_doc.resource.parentId != nil do
              Index.get(current_doc.resource.parentId)
            end
          }
        end)
    end
end