defmodule FieldPublication.Publications.Search do
  alias FieldPublication.OpenSearchService
  alias FieldPublication.DocumentSchema.Publication
  alias FieldPublication.Publications.Data

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
        %{term: %{key => value}}
      end)

    payload =
      if Enum.empty?(filter_params) do
        payload
      else
        boolean_query = Map.put(payload.query.bool, :filter, %{bool: %{must: filter_params}})

        put_in(payload.query.bool, boolean_query)
      end

    OpenSearchService.run_search(payload)
    |> case do
      {:ok, %{status: 200, body: body}} ->
        body = Jason.decode!(body)

        %{
          total: body["hits"]["total"]["value"],
          docs:
            body["hits"]["hits"]
            |> Enum.map(fn %{"_source" => doc} ->
              Map.put(doc, :id, doc["id"])
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
    {:ok, %{status: 200, body: body}} = OpenSearchService.get_project_mappings()

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
        {key, %{terms: %{field: key, size: 200}}}
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
        properties: Map.merge(base_mapping, configuration_based_mapping)
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
      %{
        "category" => res["category"],
        "id" => res["id"],
        "identifier" => res["identifier"],
        "publication_draft_date" => publication.draft_date,
        "project_name" => publication.project_name,
        "full_doc" => full_doc,
        "full_doc_as_text" => Jason.encode!(full_doc)
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

            nil ->
              nil
          end

        {"#{field_name}_keyword", value_list}
      end)
      |> Stream.reject(fn {_field_name, value} ->
        value == nil
      end)
      |> Enum.into(%{})

    base_document
    |> Map.merge(additional_fields)
    |> Map.merge(additional_fields_2)
  end

  def evaluate_input_types(%Publication{} = publication) do
    field_names_and_input_types =
      Data.get_configuration(publication)
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
end
