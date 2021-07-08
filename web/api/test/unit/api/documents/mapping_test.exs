defmodule Api.Documents.MappingTest do
  import Api.Core.Utils
  alias Api.Documents.Mapping
  alias Api.Core.ProjectConfigLoader
  use ExUnit.Case
  
  setup_all do
    result = File.read!("test/resources/elasticsearch_result.json")
             |> Poison.decode!
             |> atomize_up_to(:_source)
    [result: result]
  end
  
  # TODO: mock default_filters and test if labels are added to mapped result
  
  test "init", %{ result: result } do
    start_supervised({ProjectConfigLoader, {"resources/projects", ["default"]}})
    configuration = ProjectConfigLoader.get("default")
    mapped = Mapping.map(result, configuration)
    
    assert mapped.size == result.hits.total.value
    
    aggregation2 = result.aggregations[:"resource.category"]
    assert length(get_in(mapped, [:filters, Access.at(1), :values])) == length(aggregation2.buckets)
    
    mapped_value = get_in(mapped.filters, [Access.at(1), :values, Access.at(0), :item, :value, :name])
    original_value = get_in(aggregation2.buckets, [Access.at(0), :key])
    assert mapped_value == original_value
    
    assert length(mapped.documents) == length(result.hits.hits)
    
    mapped_identifier = get_in(mapped.documents, [Access.at(0), :resource, :identifier])
    original_key = get_in(result.hits.hits, [Access.at(0), :_source, "resource", "identifier"])
    assert mapped_identifier == original_key

    mapped_parent_id = get_in(mapped.documents, [Access.at(0), :resource, :parentId])
    original_parent_id = get_in(result.hits.hits,
      [Access.at(0), :_source, "resource", "relations", "isChildOf", Access.at(0), "resource", "id"])
    assert mapped_parent_id == original_parent_id

    mapped_grandparent_id = get_in(mapped.documents, [Access.at(0), :resource, :grandparentId])
    original_grandparent_id = get_in(result.hits.hits,
      [Access.at(0), :_source, "resource", "relations", "isChildOf", Access.at(0), "resource", "parentId"])
    assert mapped_grandparent_id == original_grandparent_id
  end
end
