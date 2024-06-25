defmodule FieldPublication.Publications.Search do
  alias FieldPublication.OpensearchService

  defp generate_aggs() do
    {:ok, %{status: 200, body: body}} = OpensearchService.get_project_mappings()

    _keyword_fields =
      Jason.decode!(body)
      |> Enum.reduce([], fn {
                              _publication_index_name,
                              %{"mappings" => %{"properties" => props}}
                            },
                            acc ->
        keywords =
          Enum.filter(props, fn {_key, %{"type" => type}} -> type == "keyword" end)
          |> Enum.reject(fn {key, _props} -> key in ["id", "identifier"] end)
          |> Enum.map(fn {key, _props} -> key end)

        acc = acc ++ (keywords -- acc)

        acc
      end)
      |> Enum.map(fn key ->
        {key, %{terms: %{field: key, size: 20}}}
      end)
      |> Enum.into(%{})
  end

  def fuzzy_search(q, filter, from \\ 0, size \\ 100) do
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
        aggs: generate_aggs(),
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

    OpensearchService.run_search(payload)
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
            |> Enum.map(&reduce_aggregation/1)
            |> Enum.into(%{})
        }
    end
  end

  def search_stream(q, start_from, size, filter) do
    Stream.resource(
      fn ->
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
            size: size,
            from: start_from
          }

        filter_params =
          Enum.map(filter, fn {key, value} ->
            %{term: %{key => value}}
          end)

        if Enum.empty?(filter_params) do
          payload
        else
          boolean_query = Map.put(payload.query.bool, :filter, %{bool: %{must: filter_params}})

          put_in(payload.query.bool, boolean_query)
        end
      end,
      fn payload ->
        {:ok, %{status: 200, body: body}} = OpensearchService.run_search(payload)

        body = Jason.decode!(body)

        body["hits"]["hits"]
        |> case do
          [] ->
            {:halt, :ok}

          hits ->
            {
              hits
              |> Enum.map(fn %{"_source" => doc} ->
                Map.put(doc, :id, doc["id"])
              end),
              Map.put(payload, :from, payload.from + payload.size)
            }
        end
      end,
      fn final_payload ->
        IO.inspect(final_payload)
        :ok
      end
    )
  end

  defp reduce_aggregation({field, %{"buckets" => buckets}}) do
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
end
