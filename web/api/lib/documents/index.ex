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
    {filters, multilanguage_filters, must_not, project_conf} = preprocess(filters, must_not)

    query = create_search_query q, size, from, filters, must_not, exists,
      not_exists, sort, vector_query, readable_projects, multilanguage_filters

    result = query |> build_post_atomize |> Mapping.map(project_conf)

    multilanguage_filters = []
    filters = Enum.filter filters, fn {k, _v} -> k != "resource.category.name" end
    # TODO remove dropdown filters and any other field specific filters here

    query2 = create_search_query q, size, from, filters, must_not, exists,
      not_exists, sort, vector_query, readable_projects, multilanguage_filters

    result2 = query2 |> build_post_atomize |> Mapping.map(project_conf)

    if Map.has_key? result2, :filters do
      category_filters = Enum.filter result2.filters, fn e -> e.name == "resource.category.name" end

      if List.first category_filters do
        category_filter = List.first category_filters
        unfiltered_values = category_filter.values

        result_category_filters = Enum.map result.filters, fn filter ->
          if filter.name == "resource.category.name" do
            put_in filter[:unfilteredValues], unfiltered_values
          else
            filter
          end
        end
        put_in result[:filters], result_category_filters
      else
        result
      end
    else
      result
    end
  end

  def search_geometries(q, filters, must_not, exists, not_exists, readable_projects) do
    {filters, _multilanguage_filters, must_not, project_conf} = preprocess(filters, must_not)
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
    {filters, multilanguage_filters} = Filter.split_off_multilanguage_filters_and_add_name_suffixes filters, project_conf, languages

    filters =
      filters
      |> Filter.wrap_values_as_singletons
      |> Filter.expand_categories(project_conf)
    must_not =
      must_not
      |> Filter.parse
      |> Filter.wrap_values_as_singletons
      |> Filter.expand_categories(project_conf)

    {filters, multilanguage_filters, must_not, project_conf}
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
