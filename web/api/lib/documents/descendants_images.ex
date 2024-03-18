defmodule Api.Documents.DescendantsImages do
    alias Api.Documents.Index

    def get(doc, number_of_images, readable_projects) do
      fetch_image_ids(doc, number_of_images, readable_projects)
    end

    defp fetch_image_ids(doc, number_of_images, readable_projects) do
      children = fetch_children(doc, readable_projects)
      image_ids = get_image_ids(children)
      if length(image_ids) >= number_of_images do
        Enum.take(image_ids, number_of_images)
      else
        image_ids ++ fetch_image_ids_from_children(children, number_of_images - length(image_ids), readable_projects)
      end
    end

    defp fetch_image_ids_from_children(children, number_of_images, readable_projects) do
      results = Enum.map(
        children,
        fn child -> fetch_image_ids(child, number_of_images, readable_projects) end
      ) |> Enum.filter(fn image_ids -> length(image_ids) > 0 end)

      select_image_ids_evenly_from_children(results, number_of_images)
    end

    defp fetch_children(doc, readable_projects) do
      Index.search(
        "resource.relations.isChildOf.resource.id:#{doc.resource.id}",
        1000, 0, nil, nil, nil, nil, nil, nil, readable_projects
      )[:documents]
    end

    defp get_image_ids(docs) do
      Enum.filter(docs, fn doc -> Map.has_key?(doc.resource, :relations) && Map.has_key?(doc.resource.relations, :isDepictedIn) end)
      |> Enum.map(fn doc -> Enum.at(doc.resource.relations.isDepictedIn, 0).resource.id end)
    end

    defp select_image_ids_evenly_from_children([], _), do: []
    defp select_image_ids_evenly_from_children(children_ids_results, number_of_images) do
      Stream.unfold(
        { children_ids_results, 0, number_of_images },
        fn
          { [], _, _ } -> nil
          { _, _, 0 } -> nil
          { children_ids, child_index, number } ->
            child_ids = Enum.at(children_ids, child_index)
            id = Enum.at(child_ids, 0)
            updated_children_ids = List.replace_at(children_ids, child_index, Enum.drop(child_ids, 1))
            |> Enum.filter(fn ids -> length(ids) > 0 end)
            new_child_index = if length(children_ids) == length(updated_children_ids) do
              if child_index + 1 == length(children_ids), do: 0, else: child_index + 1
            else
              child_index
            end
            { id, { updated_children_ids, new_child_index, number - 1 } }
        end
      ) |> Enum.to_list
    end
end
