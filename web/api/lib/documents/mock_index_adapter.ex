defmodule Api.Documents.MockIndexAdapter do

  @doc_a %{
    project: "a",
    resource: %{
      id: "1",
      identifier: "ident1",
      category: %{"name" => "Operation"},
      groups: []
    }
  }
  @doc_b %{
    project: "b",
    resource: %{
      id: "2",
      identifier: "ident2",
      category: %{"name" => "Operation"},
      groups: []
    }
  }
  @project_doc %{
    resource: %{
      id: "proj",
      identifier: "proj",
      category: "Project",
      groups: [],
      license: "some-license"
    }
  }

  def post_query query do

    decoded_and_atomized = Api.Core.Utils.atomize(Poison.decode!(query))


    hits = case decoded_and_atomized.query.script_score.query.bool.must.query_string.query do
      "*" ->

        filters = decoded_and_atomized.query.script_score.query.bool.filter
        %{ terms: %{ project: readable_projects }} = Enum.find(filters, fn filter -> Map.has_key? filter, :terms end)
        Enum.filter([@doc_a, @doc_b], fn doc -> doc.project in readable_projects end)

      "_id:doc-of-proj-a" -> @doc_a
      "_id:doc-of-proj-b" -> @doc_b
      "_id:a" -> @project_doc
      "_id:b" -> @project_doc
      _ -> nil
    end

    if is_list hits do
      %{
        hits: %{ total: %{ value: length(hits) }, hits: Enum.map(hits, &wrap_source/1)},
        # currently this is just hardcoded (for the router_search_test)
        aggregations: %{
          "resource.category": %{
            buckets: [
              %{
                key: "Operation",
                doc_count: 1,
                data: %{
                  hits: %{
                    hits: [
                      %{ _source: %{
                        "resource.category": [%{
                        name: "Operation",
                          label: %{
                              de: "Maßnahme",
                              en: "Operation"
                          }
                      }]
                      }}
                    ]
                  }
                }
              }
            ]
          }
        }
      }
    else
      %{ hits: %{ hits: [ wrap_source(hits) ]}}
    end
  end

  defp wrap_source hit do
    %{ _source: hit }
  end
end
