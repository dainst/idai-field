defmodule FieldPublication.Publications.Search do
  alias FieldPublication.Publications
  alias FieldPublication.Projects
  alias FieldPublication.OpenSearchService
  alias FieldPublication.Publications.Data

  alias FieldPublication.DatabaseSchema.{
    Publication,
    Project
  }

  require Logger

  defmodule SearchDocument do
    @derive Jason.Encoder
    @enforce_keys [
      :id,
      :identifier,
      :category,
      :project_name,
      :publication_draft_date,
      :automatically_mapped_fields,
      :full_doc,
      :full_doc_as_text
    ]
    defstruct [
      :id,
      :identifier,
      :category,
      :project_name,
      :publication_draft_date,
      :automatically_mapped_fields,
      :full_doc,
      :full_doc_as_text
    ]
  end

  def search_document_map_to_struct(%{
        "id" => id,
        "identifier" => identifier,
        "category" => category,
        "project_name" => project_name,
        "publication_draft_date" => publication_draft_date,
        "automatically_mapped_fields" => automatically_mapped_fields,
        "full_doc" => full_doc,
        "full_doc_as_text" => full_doc_as_text
      }) do
    %SearchDocument{
      id: id,
      identifier: identifier,
      category: category,
      project_name: project_name,
      publication_draft_date: publication_draft_date,
      automatically_mapped_fields: automatically_mapped_fields,
      full_doc: Data.document_map_to_struct(full_doc),
      full_doc_as_text: full_doc_as_text
    }
  end

  def initialize_search_indices(%Publication{} = pub) do
    publication_alias = get_search_alias(pub)

    index_a = "#{publication_alias}__a__"
    index_b = "#{publication_alias}__b__"

    project_alias =
      pub.project_name
      |> Projects.get!()
      |> get_search_alias()

    aliased_project_index =
      project_alias
      |> OpenSearchService.get_indices_behind_alias()
      |> List.first()

    if aliased_project_index in [index_a, index_b] do
      OpenSearchService.remove_alias(
        aliased_project_index,
        project_alias
      )

      # TODO?: As a fallback we could search all publications associated to the project,
      # pick the most current one and use that one as the project alias.
    end

    [ok: _, ok: _] =
      Enum.map([index_a, index_b], &OpenSearchService.delete_index/1)

    [ok: %{status: 200}, ok: %{status: 200}] =
      Enum.map([index_a, index_b], &OpenSearchService.create_index/1)

    OpenSearchService.set_alias(index_a, publication_alias)
  end

  def switch_active_alias(%Publication{} = pub) do
    publication_alias = get_search_alias(pub)

    old_index =
      publication_alias
      |> OpenSearchService.get_indices_behind_alias()
      |> List.first("#{publication_alias}__a__")

    next_index =
      if String.ends_with?(old_index, "__a__") do
        "#{publication_alias}__b__"
      else
        "#{publication_alias}__a__"
      end

    OpenSearchService.remove_alias(old_index, publication_alias)
    OpenSearchService.set_alias(next_index, publication_alias)

    project_alias =
      pub.project_name
      |> Projects.get!()
      |> get_search_alias()

    if project_alias
       |> OpenSearchService.get_indices_behind_alias()
       |> List.first() == old_index do
      OpenSearchService.remove_alias(old_index, project_alias)
      OpenSearchService.set_alias(next_index, project_alias)
    end

    :ok
  end

  def reset_inactive_index(%Publication{} = pub, mapping) do
    publication_alias = get_search_alias(pub)

    inactive_index =
      publication_alias
      |> OpenSearchService.get_indices_behind_alias()
      |> List.first()
      |> invert_search_index_name()

    OpenSearchService.delete_index(inactive_index)
    OpenSearchService.create_index(inactive_index, mapping)
  end

  def set_project_alias(%Publication{} = pub) do
    publication_alias = get_search_alias(pub)

    project_alias =
      pub.project_name
      |> Projects.get!()
      |> get_search_alias()

    old_index =
      project_alias
      |> OpenSearchService.get_indices_behind_alias()
      |> List.first()

    next_index =
      publication_alias
      |> OpenSearchService.get_indices_behind_alias()
      |> List.first()

    unless old_index == nil do
      OpenSearchService.remove_alias(old_index, project_alias)
    end

    OpenSearchService.set_alias(next_index, project_alias)
  end

  def clear_project_alias(%Publication{} = pub) do
    project_alias =
      pub.project_name
      |> Projects.get!()
      |> get_search_alias()

    index =
      project_alias
      |> OpenSearchService.get_indices_behind_alias()
      |> List.first()

    OpenSearchService.remove_alias(index, project_alias)
  end

  def get_doc_count(%Publication{} = pub) do
    pub
    |> get_search_alias()
    |> OpenSearchService.get_doc_count()
  end

  def index_documents(docs, %Publication{} = pub, inactive_alias \\ true) do
    index =
      get_search_alias(pub)
      |> OpenSearchService.get_indices_behind_alias()
      |> List.first()

    index =
      if inactive_alias do
        invert_search_index_name(index)
      else
        index
      end

    OpenSearchService.insert_documents(docs, index)
  end

  def search(q, filter, from \\ 0, size \\ 100) do
    q =
      case q do
        "*" ->
          q

        "" ->
          "*"

        q ->
          "#{q}~"
      end

    payload =
      %{
        query: %{
          bool: %{
            must: %{
              query_string: %{
                query: q
              }
            }
          }
        },
        aggs: generate_aggregations_queries(),
        from: from,
        size: size
      }

    filter_params =
      Enum.map(filter, fn {key, value} ->
        cond do
          key in ["category", "project_name"] ->
            %{term: %{key => value}}

          true ->
            %{term: %{"automatically_mapped_fields.#{key}" => value}}
        end
      end)

    payload =
      if Enum.empty?(filter_params) do
        payload
      else
        boolean_query = Map.put(payload.query.bool, :filter, %{bool: %{must: filter_params}})

        put_in(payload.query.bool, boolean_query)
      end

    OpenSearchService.run_query("project_*", payload)
    |> case do
      {:ok, %{status: 200, body: body}} ->
        body = Jason.decode!(body)

        %{
          total: body["hits"]["total"]["value"],
          docs:
            body["hits"]["hits"]
            |> Enum.map(fn %{"_source" => doc} ->
              search_document_map_to_struct(doc)
            end),
          aggregations:
            body
            |> Map.get("aggregations", %{})
            |> Stream.map(&parse_aggregation_result/1)
            |> Stream.reject(fn {_field, buckets} -> buckets == [] end)
            |> Enum.sort_by(
              # Sorts the aggregations by descending size of all bucket entries
              fn {_field, buckets} ->
                Enum.reduce(buckets, 0, fn %{count: count}, acc -> acc + count end)
              end,
              &Kernel.>=/2
            )
        }
    end
  end

  defp generate_aggregations_queries() do
    {:ok, %{status: 200, body: body}} = OpenSearchService.get_mapping("project*")

    _keyword_fields =
      Jason.decode!(body)
      |> Enum.reduce([], fn {
                              _publication_index_name,
                              %{"mappings" => %{"properties" => props}}
                            },
                            acc ->
        keywords =
          props
          |> Enum.map(fn prop ->
            case prop do
              {key, %{"type" => "keyword"}} ->
                key

              {key, %{"properties" => nested_props}} ->
                Enum.map(nested_props, fn nested_prop ->
                  case nested_prop do
                    {nested_key, %{"type" => "keyword"}} ->
                      "#{key}.#{nested_key}"

                    _ ->
                      nil
                  end
                end)

              _ ->
                nil
            end
          end)
          |> List.flatten()
          |> Enum.reject(fn key -> key in [nil, "id", "identifier"] end)

        acc = acc ++ (keywords -- acc)

        acc
      end)
      |> Stream.map(fn key ->
        cond do
          key in ["category", "project_name"] ->
            {key, %{terms: %{field: key, size: 200}}}

          true ->
            {key, %{terms: %{field: "automatically_mapped_fields.#{key}", size: 200}}}
        end
      end)
      |> Enum.into(%{})
  end

  defp parse_aggregation_result({field, %{"buckets" => buckets}}) do
    {field,
     Enum.map(
       buckets,
       fn %{
            "doc_count" => count,
            "key" => key
          } ->
         %{
           key: key,
           count: count
         }
       end
     )}
  end

  def generate_index_mapping(pub) do
    base_mapping = %{
      id: %{
        type: "keyword",
        store: true
      },
      identifier: %{
        type: "keyword",
        store: true
      },
      category: %{
        type: "keyword",
        store: true
      },
      project_name: %{
        type: "keyword",
        store: true
      },
      publication_draft_date: %{
        type: "date",
        store: true
      },
      full_doc: %{
        type: "flat_object"
      },
      full_doc_as_text: %{
        type: "text"
      }
    }

    configuration_based_mapping =
      evaluate_input_types(pub)
      |> then(fn %{
                   single_keyword_fields: single_keyword_fields,
                   multi_keyword_fields: multi_keyword_fields
                 } ->
        Enum.concat([single_keyword_fields, multi_keyword_fields])
      end)
      |> Stream.map(fn {_category_name, field_name} ->
        {"#{field_name}_keyword", %{type: "keyword", store: true}}
      end)
      |> Enum.into(%{})

    %{
      mappings: %{
        properties:
          Map.merge(
            base_mapping,
            %{
              automatically_mapped_fields: %{
                type: "object",
                properties: configuration_based_mapping
              }
            }
          )
      }
    }
  end

  def prepare_doc_for_indexing(doc, %Publication{} = publication, publication_configuration, %{
        single_keyword_fields: single_keyword_fields,
        multi_keyword_fields: multi_keyword_fields
      }) do
    %{"resource" => res} =
      doc =
      doc
      |> Map.put("id", doc["_id"])
      |> Map.delete("_id")

    full_doc =
      Data.apply_project_configuration(doc, publication_configuration, publication)

    base_document =
      %SearchDocument{
        id: res["id"],
        identifier: res["identifier"],
        category: res["category"],
        publication_draft_date: publication.draft_date,
        project_name: publication.project_name,
        automatically_mapped_fields: %{},
        full_doc: full_doc,
        full_doc_as_text: Jason.encode!(full_doc)
      }

    additional_fields =
      single_keyword_fields
      |> Stream.filter(fn {category_name, _field_name} ->
        category_name == res["category"]
      end)
      |> Stream.map(fn {_this_category, field_name} ->
        {"#{field_name}_keyword", Map.get(res, field_name)}
      end)
      |> Stream.reject(fn {_field_name, value} ->
        value == nil
      end)
      |> Enum.into(%{})

    additional_fields_2 =
      multi_keyword_fields
      |> Stream.filter(fn {category_name, _field_name} ->
        category_name == res["category"]
      end)
      |> Stream.map(fn {_this_category, field_name} ->
        value_list =
          Map.get(res, field_name)
          |> case do
            values when is_list(values) ->
              values

            values when is_map(values) ->
              Map.values(values)

            values when is_binary(values) ->
              Logger.warning(
                "Based on the project configuration expected Map or List values for field '#{field_name}' in '#{res["id"]}', but got '#{values}'."
              )

              [values]

            nil ->
              nil
          end

        {"#{field_name}_keyword", value_list}
      end)
      |> Stream.reject(fn {_field_name, value} = val ->
        value == nil or is_binary(val)
      end)
      |> Enum.into(%{})

    base_document
    |> Map.merge(additional_fields)
    |> Map.merge(additional_fields_2)

    Map.put(
      base_document,
      :automatically_mapped_fields,
      Map.merge(additional_fields, additional_fields_2)
    )
  end

  def get_label_usage() do
    Cachex.get(:document_cache, :system_wide_label_usage)
    |> case do
      {:ok, nil} ->
        update_label_usage()

      {:ok, info} ->
        info
    end
  end

  def update_label_usage() do
    info =
      Publications.get_current_published()
      |> Enum.map(fn %Publication{} = pub ->
        config = Publications.get_configuration(pub)

        {category_labels, field_labels} =
          Enum.map(config, &extract_labels_for_item/1)
          |> Enum.reduce({%{}, %{}}, fn {category_result, field_result},
                                        {category_acc, field_acc} ->
            {
              Map.merge(category_result, category_acc),
              Map.merge(field_result, field_acc)
            }
          end)

        {
          pub.project_name,
          category_labels,
          field_labels
        }
      end)
      |> Enum.reduce(
        %{category_labels: %{}, field_labels: %{}},
        fn {
             project_name,
             category_labels,
             field_labels
           },
           %{
             category_labels: category_labels_acc,
             field_labels: field_labels_acc
           } = outer_acc ->
          {updated_category_acc, _project_name} =
            Enum.reduce(
              category_labels,
              {category_labels_acc, project_name},
              &evaluate_category_label_usage/2
            )

          {updated_field_acc, _project_name} =
            Enum.reduce(
              field_labels,
              {field_labels_acc, project_name},
              &evaluate_field_label_usage/2
            )

          outer_acc
          |> put_in([:category_labels], updated_category_acc)
          |> put_in([:field_labels], updated_field_acc)
        end
      )

    Cachex.put(:document_cache, :system_wide_label_usage, info)

    info
  end

  defp extract_labels_for_item(%{
         "item" => %{
           "label" => label,
           "name" => name,
           "groups" => groups
         },
         "trees" => child_categories
       }) do
    field_labels =
      groups
      |> Enum.map(&extract_label_for_fields/1)
      |> List.flatten()
      |> Enum.reduce(%{}, fn result, acc -> Map.merge(result, acc) end)

    {child_category_labels, child_field_labels} =
      child_categories
      |> Enum.map(&extract_labels_for_item/1)
      |> Enum.reduce({%{}, %{}}, fn {category_result, field_result}, {category_acc, field_acc} ->
        {
          Map.merge(category_result, category_acc),
          Map.merge(field_result, field_acc)
        }
      end)

    {
      Map.merge(%{name => label}, child_category_labels),
      Map.merge(field_labels, child_field_labels)
    }
  end

  defp extract_label_for_fields(%{"fields" => fields}) do
    fields
    |> Stream.filter(fn %{"inputType" => input_type} ->
      input_type != "relation"
    end)
    |> Enum.map(fn %{"label" => field_labels, "name" => field_name} = field ->
      value_labels =
        field
        |> Map.get("valuelist", %{})
        |> Map.get("values", %{})
        |> Enum.map(fn {key, map} -> {key, Map.get(map, "label", %{})} end)
        |> Enum.reject(fn {_key, map} -> Enum.empty?(map) end)
        |> Enum.into(%{})

      %{field_name => %{"labels" => field_labels, "value_labels" => value_labels}}
    end)
  end

  defp evaluate_category_label_usage({name, labels}, {acc, project_name}) do
    existing = Map.get(acc, name, %{})

    translations =
      if Enum.empty?(existing) do
        Enum.map(labels, fn {lang, text} ->
          {lang, [{text, 1, [project_name]}]}
        end)
        |> Enum.into(%{})
      else
        Enum.map(labels, fn {lang, text} ->
          if Map.has_key?(existing, lang) do
            {matching_variant, other_variants} =
              existing[lang]
              |> Enum.split_with(fn {variant_text, _count, _project_list} ->
                variant_text == text
              end)

            variants =
              case matching_variant do
                [] ->
                  existing[lang] ++ [{text, 1, [project_name]}]

                [{text, count, projects_list}] ->
                  [{text, count + 1, projects_list ++ [project_name]}] ++ other_variants
              end

            {lang, variants}
          else
            {lang, [{text, 1, [project_name]}]}
          end
        end)
        |> Enum.reduce(%{}, fn {lang, translations}, acc ->
          Map.merge(acc, %{lang => translations})
        end)
      end

    {
      Map.put(acc, name, translations),
      project_name
    }
  end

  defp evaluate_field_label_usage(
         {field_name, %{"labels" => labels, "value_labels" => value_labels}},
         {acc, project_name}
       ) do
    existing = Map.get(acc, field_name, %{})

    {label_translations, value_label_translations} =
      if Enum.empty?(existing) do
        {
          Enum.map(labels, fn {lang, text} ->
            {lang, [{text, 1, [project_name]}]}
          end)
          |> Enum.into(%{}),
          Enum.map(value_labels, fn {value_name, labels} ->
            translations =
              Enum.map(labels, fn {lang, text} ->
                {lang, [{text, 1, [project_name]}]}
              end)
              |> Enum.reduce(%{}, fn {lang, info}, inner_acc ->
                Map.put(inner_acc, lang, info)
              end)

            {value_name, translations}
          end)
          |> Enum.into(%{})
        }
      else
        {
          Enum.map(labels, fn {lang, text} ->
            if Map.has_key?(existing, lang) do
              {matching_variant, other_variants} =
                existing[lang]
                |> Enum.split_with(fn {variant_text, _count, _project_list} ->
                  variant_text == text
                end)

              variants =
                case matching_variant do
                  [] ->
                    existing[lang] ++ [{text, 1, [project_name]}]

                  [{text, count, projects_list}] ->
                    [{text, count + 1, projects_list ++ [project_name]}] ++ other_variants
                end

              {lang, variants}
            else
              {lang, [{text, 1, [project_name]}]}
            end
          end)
          |> Enum.reduce(%{}, fn {lang, translations}, acc ->
            Map.merge(acc, %{lang => translations})
          end),
          Enum.map(value_labels, fn {value_name, value_list_labels} ->
            translations =
              Enum.map(value_list_labels, fn {lang, text} ->
                if Map.has_key?(existing["value_labels"], value_name) do
                  if Map.has_key?(existing["value_labels"][value_name], lang) do
                    {matching_variant, other_variants} =
                      existing["value_labels"][value_name][lang]
                      |> Enum.split_with(fn {variant_text, _count, _project_list} ->
                        variant_text == text
                      end)

                    variants =
                      case matching_variant do
                        [] ->
                          existing["value_labels"][value_name][lang] ++
                            [{text, 1, [project_name]}]

                        [{text, count, projects_list}] ->
                          [{text, count + 1, projects_list ++ [project_name]}] ++ other_variants
                      end

                    {lang, variants}
                  else
                    {lang, [{text, 1, [project_name]}]}
                  end
                else
                  {lang, [{text, 1, [project_name]}]}
                end
              end)
              |> Enum.reduce(%{}, fn {lang, translations}, acc ->
                Map.merge(acc, %{lang => translations})
              end)

            {value_name, translations}
          end)
          |> Enum.into(%{})
        }
      end

    {
      Map.put(acc, field_name, %{
        "labels" => label_translations,
        "value_labels" => value_label_translations
      }),
      project_name
    }
  end

  def evaluate_input_types(%Publication{} = publication) do
    field_names_and_input_types =
      Publications.get_configuration(publication)
      |> Enum.map(&flatten_input_types/1)
      |> List.flatten()
      |> Enum.uniq()
      |> Enum.group_by(
        fn {_categoy, _name, input_type} ->
          input_type
        end,
        fn {category, name, _input_type} ->
          {category, name}
        end
      )

    keyword_candidates =
      field_names_and_input_types
      |> Enum.filter(fn {input_type, _category_and_field_names} ->
        input_type in get_keyword_inputs()
      end)
      |> Enum.map(fn {_input_type, category_and_field_names} -> category_and_field_names end)
      |> List.flatten()

    multi_keyword_candidates =
      field_names_and_input_types
      |> Enum.filter(fn {input_type, _category_and_field_names} ->
        input_type in get_keyword_multi_inputs()
      end)
      |> Enum.map(fn {_input_type, category_and_field_names} -> category_and_field_names end)
      |> List.flatten()

    %{
      single_keyword_fields: keyword_candidates,
      multi_keyword_fields: multi_keyword_candidates
    }
  end

  defp flatten_input_types(
         %{
           "item" => %{"name" => category, "groups" => groups},
           "trees" => child_items
         } = _config_item
       ) do
    (Enum.map(groups, fn %{"fields" => fields} ->
       Enum.map(fields, fn %{"name" => name, "inputType" => input_type} ->
         {category, name, input_type}
       end)
     end)
     |> List.flatten()) ++ Enum.map(child_items, &flatten_input_types/1)
  end

  defp flatten_input_types(nil) do
    []
  end

  def get_keyword_inputs(), do: ["dropdown", "radio"]
  def get_keyword_multi_inputs(), do: ["checkboxes", "dropdownRange"]

  def get_search_alias(%Publication{} = publication) do
    publication
    |> Publications.get_doc_id()
    |> OpenSearchService.encode_chars()
  end

  def get_search_alias(%Project{} = project) do
    project
    |> Projects.get_document_id()
    |> OpenSearchService.encode_chars()
  end

  def get_currently_aliased_publication(%Project{} = project) do
    project
    |> get_search_alias()
    |> OpenSearchService.get_indices_behind_alias()
    |> case do
      [] ->
        {:error, :alias_not_set}

      values when is_list(values) ->
        values
        |> List.first()
        |> index_name_to_publication()
        |> case do
          {:error, :not_found} ->
            {:error, :publication_not_found}

          success ->
            success
        end
    end
  end

  def index_name_to_publication(name) do
    regex = ~r/^publication_(.*)_(\d{4}-\d{2}-\d{2})__[ab]__$/

    [[_full_match, project_name, draft_date_iso_8601]] = Regex.scan(regex, name)

    Publications.get(project_name, draft_date_iso_8601)
  end

  defp invert_search_index_name(index_name) do
    if String.ends_with?(index_name, "__a__") do
      String.replace(index_name, "__a__", "__b__")
    else
      String.replace(index_name, "__b__", "__a__")
    end
  end
end
