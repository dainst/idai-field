defmodule Api.Documents.Query do
  alias Api.Core.Filters

  def init(q, size), do: init(q, size, 0)
  def init(q, size, from) do
    build_query_template(q, size, from)
  end

  def track_total(query) do
    put_in(query, [:track_total_hits], true)
  end

  def add_aggregations(query), do: add_aggregations(query, Filters.get_filters())
  def add_aggregations(query, filters) do
    Map.put(query, :aggs, Enum.map(filters, &build_aggregation/1) |> Enum.into(%{}))
  end

  def set_readable_projects(query, readable_projects) do
    update_in(query.query.script_score.query.bool.filter, fn filter ->
      filter ++ [%{ terms: %{ project: readable_projects }}]
    end)
  end

  def add_filters(query, nil), do: query
  def add_filters(query, filters) do
    filter = Enum.map(filters, &build_terms_query/1)
    update_in(query.query.script_score.query.bool.filter, &(&1 ++ filter))
  end
  
  def add_should_filters(query, nil), do: query
  def add_should_filters(query, filters) do
    filter = %{ bool: %{ should: Enum.map(filters, &build_match_query/1) }}
    update_in(query.query.script_score.query.bool.filter, &(&1 ++ filter))
  end

  def add_must_not(query, nil), do: query
  def add_must_not(query, must_not) do
    must_not = Enum.map(must_not, &build_terms_query/1)
    update_in(query.query.script_score.query.bool.must_not, &(&1 ++ must_not))
  end

  def add_exists(query, nil), do: query
  def add_exists(query, exists) do
    exists_filter = Enum.map(exists, &build_exists_query/1)
    update_in(query.query.script_score.query.bool.filter, &(&1 ++ exists_filter))
  end

  def add_not_exists(query, nil), do: query
  def add_not_exists(query, not_exists) do
    exists_filter = Enum.map(not_exists, &build_exists_query/1)
    update_in(query.query.script_score.query.bool.must_not, &(&1 ++ exists_filter))
  end

  def only_fields(query, fields) do
    put_in(query, [:_source], fields)
  end

  def set_sort(query, nil), do: query
  def set_sort(query, fields = [_|_]) do
    put_in(query, [:sort], fields)
  end
  def set_sort(query, field) do
    put_in(query, [:sort], field)
  end

  def set_vector_query(query, nil), do: query
  def set_vector_query(query, %{ "model" => model, "query_vector" => query_vector }) do
    field = "resource.relations.isDepictedIn.resource.featureVectors.#{model}"
    query = add_exists(query, [field])
    script = %{
      source: "1 / (1 + l2norm(params.query_vector, '#{field}'))",
      params: %{
        query_vector: query_vector
      }
    }
    put_in(query.query.script_score.script, script)
  end

  def build(query) do
    Poison.encode!(query)
  end

  defp build_query_template(q, size, from) do
    %{
      query: %{
        script_score: %{
          query: %{
            bool: %{
              must: %{
                query_string: %{
                  query: q
                }
              },
              filter: [],
              must_not: []
            }
          },
          script: %{
            source: "_score"
          }
        }
      },
      size: size,
      from: from
    }
  end

  defp build_terms_query({field, value}) do
    %{ terms: %{ field => value }}
  end

  defp build_match_query({field, value}) do
    %{ match: %{ field => value }}
  end

  defp build_exists_query(field) do
    %{ exists: %{ field: field } }
  end

  defp build_aggregation(filter = %{ labeled_value: true }) do
    { filter.field, %{
      terms: %{ field: "#{filter.field}.name", size: filter.size },
      aggs: Map.new([{ :data, %{ top_hits: %{ size: 1, _source: ["#{filter.field}"] } } }])
    }}
  end
  defp build_aggregation(filter = %{ labeled_value: false }) do
    { filter.field, %{
      terms: %{ field: "#{filter.field}", size: filter.size }
    }}
  end
end
