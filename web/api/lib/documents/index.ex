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
    {filters, multilanguage_filters, must_not, project_conf, dropdown_fields} = preprocess(filters, must_not)
    filters_without_category_filters = Enum.filter(filters, fn {k, _v} -> k != "resource.category.name" end)

    original_query_result = create_search_query(q, size, from, filters, must_not, exists,
      not_exists, sort, vector_query, readable_projects, multilanguage_filters)
      |> build_post_atomize
      |> Mapping.map(project_conf)

    if filters_without_category_filters == filters do
      original_query_result
    else # a category filter has been set, i.e. a (single) category has been "selected"
      {_, categories} = filters
        |> Enum.filter(fn {k, _v} -> k == "resource.category.name" end)
        |> List.first
      category = List.first categories
      filtered_filters = filters_without_category_filters
        |> Enum.filter(fn {k, _v} -> k not in dropdown_fields end)
      replacement_query_result = create_search_query(
          q, size, from, filtered_filters, must_not, exists,
          not_exists, sort, vector_query, readable_projects, [])
        |> build_post_atomize
        |> Mapping.map(project_conf, nil, category)
      postprocess_search_result original_query_result, replacement_query_result
    end
  end

  def search_geometries(q, filters, must_not, exists, not_exists, readable_projects) do
    {filters, _multilanguage_filters, must_not, project_conf, _} = preprocess(filters, must_not)
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

  defp postprocess_search_result original_query_result, unfiltered_query_result do
    category_filters = Enum.filter unfiltered_query_result.filters, fn e -> e.name == "resource.category.name" end
    category_filter = List.first category_filters
    unfiltered_values = category_filter.values

    result_category_filters = Enum.map original_query_result.filters, fn filter ->
      if filter.name == "resource.category.name" do
        put_in filter[:values], unfiltered_values
      else
        filter
      end
    end
    put_in original_query_result[:filters], result_category_filters
  end

  defp create_search_query q, size, from, filters, must_not, exists,
    not_exists, sort, vector_query, readable_projects, multilanguage_filters do

    Query.init(q, size, from)
      |> Query.track_total
      |> Query.add_aggregations()
      |> Query.add_filters(filters)
      |> Query.add_should_filters(multilanguage_filters)
      |> Query.add_must_not(must_not)
      |> Query.add_exists(exists)
      |> Query.add_not_exists(not_exists)
      |> Query.set_sort(sort)
      |> Query.set_readable_projects(readable_projects)
      |> Query.set_vector_query(vector_query)
  end

  defp preprocess(filters, must_not) do
    filters = Filter.parse(filters)

    project = get_project(filters)
    project_conf = ProjectConfigLoader.get project
    languages = ProjectConfigLoader.get_languages project
    {filters, multilanguage_filters, dropdown_fields} = Filter.split_off_multilanguage_filters_and_add_name_suffixes filters, project_conf, languages

    filters =
      filters
      |> Filter.wrap_values_as_singletons
      |> Filter.expand_categories(project_conf)
    must_not =
      must_not
      |> Filter.parse
      |> Filter.wrap_values_as_singletons
      |> Filter.expand_categories(project_conf)

    {filters, multilanguage_filters, must_not, project_conf, dropdown_fields}
  end

  defp get_project(nil), do: "default"
  defp get_project(filters) do
    case Enum.find(filters, fn {field, _value} -> field == "project" end) do
      {"project", project} -> project
      _ -> "default"
    end
  end

  defp build_post_atomize(query) do
    query
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
