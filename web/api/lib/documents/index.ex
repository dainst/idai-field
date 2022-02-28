defmodule Api.Documents.Index do
  require Logger
  alias Api.Documents.Mapping
  alias Api.Documents.Query
  alias Api.Documents.Filter
  alias Api.Core.ProjectConfigLoader

  @max_geometries 10000
  @exists_geometries ["resource.geometry"]
  @fields_geometries ["resource.category", "resource.geometry", "resource.identifier", "resource.id", "project"]

  def get(nil), do: nil
  def get(id) do
    Query.init("_id:#{id}", 1)
    |> build_post_atomize()
    |> Mapping.map_single()
  end

  @doc """
  filters  - pass nil to set no filters
  must_not - pass nil to set no must_not filters
  """
  def search(q, size, from, filters, must_not, exists, not_exists, sort, vector_query, readable_projects) do
    {filters, must_not, project_conf} = preprocess(filters, must_not)
    Query.init(q, size, from)
    |> Query.track_total
    |> Query.add_aggregations()
    |> Query.add_filters(filters)
    |> Query.add_must_not(must_not)
    |> Query.add_exists(exists)
    |> Query.add_not_exists(not_exists)
    |> Query.set_sort(sort)
    |> Query.set_readable_projects(readable_projects)
    |> Query.set_vector_query(vector_query)
    |> build_post_atomize
    |> Mapping.map(project_conf)

  end

  def search_aggregation(q, size, from, filters, must_not, exists, not_exists, readable_projects) do
    {filters, must_not, project_conf} = preprocess(filters, must_not)
    Query.init(q, size, from)
    |> Query.track_total
    |> Query.add_generalaggregations()
    |> Query.add_filters(filters)
    |> Query.add_must_not(must_not)
    |> Query.add_exists(exists)
    |> Query.add_not_exists(not_exists)
    |> Query.set_readable_projects(readable_projects)
    |> build_post_atomize
    |> Mapping.mapagg(project_conf)
    #|> IO.inspect()
    
  end



  def search_withafter(q, size, from, filters, must_not, exists, not_exists, search_after, sort, vector_query, readable_projects) do
    {filters, must_not, project_conf} = preprocess(filters, must_not)
    Query.init(q, size, from)
    |> Query.track_total
    |> Query.add_filters(filters)
    |> Query.add_must_not(must_not)
    |> Query.add_exists(exists)
    |> Query.add_not_exists(not_exists)
    |> Query.set_search_after(search_after)
    |> Query.set_sort(sort)
    |> Query.set_readable_projects(readable_projects)
    |> Query.set_vector_query(vector_query)
    |> build_post_atomize
    |> Mapping.map(project_conf)

  end

  def search_geometries(q, filters, must_not, exists, not_exists, readable_projects) do
    {filters, must_not, project_conf} = preprocess(filters, must_not)
    Query.init(q, @max_geometries)
    |> Query.add_filters(filters)
    |> Query.add_must_not(must_not)
    |> Query.add_exists(exists)
    |> Query.add_not_exists(not_exists)
    |> Query.add_exists(@exists_geometries)
    |> Query.only_fields(@fields_geometries)
    |> Query.set_readable_projects(readable_projects)
    |> build_post_atomize
    |> Mapping.map(project_conf)
  end

  defp preprocess(filters, must_not) do
    filters = Filter.parse(filters)
    project_conf = ProjectConfigLoader.get(get_project(filters))
    filters = Filter.expand(filters, project_conf)
    must_not = must_not |> Filter.parse |> Filter.expand(project_conf)
    {filters, must_not, project_conf}
  end

  defp get_project(nil), do: "default"
  defp get_project(filters) do
    case Enum.find(filters, fn {field, _value} -> field == "project" end) do
      {"project", [project]} -> project
      _ -> "default"
    end
  end

  defp build_post_atomize(query) do
    Logger.info("Inside build_post_atomize")
    Logger.info(query)
    query
    |> IO.inspect()
    |> Query.build
    |> index_adapter().post_query
    |> Api.Core.Utils.atomize_up_to(:_source)
  end

  defp index_adapter() do
    if Mix.env() == :test do
      Api.Documents.MockIndexAdapter
    else
      Api.Documents.ElasticsearchIndexAdapter
    end
  end
end
