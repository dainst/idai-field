defmodule Api.Documents.Mapping do
  alias Api.Core.Filters
  alias Api.Core.Tree
  alias Api.Core.Resource

  def map_single elasticsearch_result do
    elasticsearch_result
    |> get_in([:hits, :hits, Access.at(0), :_source])
    |> map_document
  end

  def map(elasticsearch_result, default_config), do: map(elasticsearch_result, default_config, Filters.get_filters())
  def map(elasticsearch_result, default_config, filters) do
    %{
      size: elasticsearch_result.hits.total.value,
      documents: elasticsearch_result.hits.hits
                 |> Enum.map(&map_document/1)
    }
    |> map_aggregations(elasticsearch_result, default_config, filters)
  end

  defp map_aggregations(result, %{ aggregations: aggregations }, default_config, filters) do
    filters = Enum.map(filters, map_aggregation(aggregations, default_config))
              |> Enum.reject(&is_nil/1)
    put_in(result, [:filters], filters)
  end
  defp map_aggregations(result, _, _, _), do: result

  defp map_aggregation(aggregations, default_config) do
    fn filter ->
      with buckets when not is_nil(buckets) <- get_in(
        aggregations,
        [String.to_atom(filter.field), :buckets]
      )
        do
          %{
            name: Filters.get_filter_name(filter),
            label: filter.label,
            groups: filter["groups"],
            values: build_values(buckets, filter, default_config)
          }
        end
    end
  end

  defp build_values(buckets, filter = %{ field: "resource.category" }, default_config) do
    buckets = map_buckets(buckets, filter)
    Tree.map_tree_list(default_config,
      fn %{ name: name, label: label, groups: groups } ->
        bucket = Enum.find(buckets, fn bucket -> bucket.value.name == name end)
        %{ value: %{ name: name, label: label, groups: groups }, count: (if bucket, do: bucket.count, else: 0) }
      end
    )
    |> Tree.filter_tree_list(fn %{ count: count } -> count > 0 end)
    |> Enum.map(&add_children_count/1)
  end
  defp build_values(buckets, filter, _), do: map_buckets(buckets, filter)

  defp map_buckets(buckets, filter) do
    Enum.map(buckets, fn bucket -> map_bucket(bucket, filter.field) end)
  end

  defp map_bucket(%{ doc_count: doc_count, key: key, data: %{ hits: %{ hits: [hit|_] } } }, field_name) do
    %{
      value: %{
        name: key,
        label: get_label(get_in(hit._source, String.split(field_name, ".")), key)
      },
      count: doc_count
    }
  end
  defp map_bucket(%{ doc_count: doc_count, key: key }, _) do
    %{
      value: %{
        name: key,
        label: %{}
      },
      count: doc_count
    }
  end

  defp map_document(%{ _source: document }), do: map_document(document)
  defp map_document(document) do
    Api.Core.CorePropertiesAtomizing.format_document(document)
    |> add_parent_id
    |> add_grandparent_id
  end

  defp add_parent_id(document) do
    put_in(document, [:resource, :parentId], Resource.get_parent_id(document.resource))
  end

  defp add_grandparent_id(document) do
    put_in(document, [:resource, :grandparentId], Resource.get_grandparent_id(document.resource))
  end

  defp add_children_count(tree_list_node) do
    put_in(tree_list_node.item.count, tree_list_node.item.count + get_children_count(tree_list_node))
  end

  defp get_children_count(tree_list_node) do
    Enum.map(tree_list_node.trees, fn tree -> tree.item.count end)
    |> Enum.sum
  end

  defp get_label(field = [_|_], value), do: Enum.find(field, &(&1["name"] == value))["label"]
  defp get_label(field = %{}, _), do: field["label"]
  defp get_label(field, _), do: field
end
