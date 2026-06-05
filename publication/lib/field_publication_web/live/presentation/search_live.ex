defmodule FieldPublicationWeb.Presentation.SearchLive do
  use FieldPublicationWeb, :live_view

  alias FieldPublication.Publications.Search
  import FieldPublicationWeb.Presentation.Components.Search

  @search_batch_limit 20

  def mount(_params, _session, socket) do
    {:ok, assign(socket, :page_title, "Search")}
  end

  def handle_params(params, _uri, socket) do
    q = Map.get(params, "q", "*")
    filters = Map.get(params, "filters", %{})

    from =
      Map.get(params, "from", "0")
      |> Integer.parse()
      |> case do
        {val, ""} ->
          val

        _ ->
          0
      end

    {
      :noreply,
      socket
      |> assign(:url_parameters, %{q: q, filters: filters, from: from})
      |> assign(:limit, @search_batch_limit)
      |> assign_async(:search_result, fn ->
        %{
          total: total,
          docs: docs,
          aggregations: aggregations
        } = Search.search(q, filters, from, @search_batch_limit)

        {project_specific_aggregations, shared_aggregations} =
          aggregations
          |> Enum.split_with(fn {field_name, _buckets} ->
            String.contains?(field_name, ":")
          end)

        aggregations = shared_aggregations ++ project_specific_aggregations

        {
          :ok,
          %{
            search_result: %{
              total: total,
              docs: docs,
              aggregations: aggregations
            }
          }
        }
      end)
    }
  end

  def handle_event(
        "search",
        %{"search_input" => input_value},
        %{assigns: %{url_parameters: parameters}} = socket
      ) do
    url_parameters =
      parameters
      |> Map.put(:q, input_value)
      |> Map.put(:from, 0)

    {
      :noreply,
      push_patch(socket,
        to: ~p"/search?#{url_parameters}"
      )
    }
  end

  def handle_event(
        "toggle_filter",
        %{"key" => key, "value" => value},
        %{assigns: %{url_parameters: url_parameters}} = socket
      ) do
    toggled_param = {key, value}

    filters = Map.get(url_parameters, :filters, %{})

    updated_filters =
      if toggled_param in filters do
        Enum.reject(filters, fn {field, _value} -> field == key end)
      else
        Map.put(filters, key, value)
      end

    url_parameters =
      url_parameters
      |> Map.put(:filters, updated_filters)
      |> Map.put(:from, 0)

    {
      :noreply,
      push_patch(socket,
        to: ~p"/search?#{url_parameters}"
      )
    }
  end

  def update_from(query_map, new_from) do
    ~p"/search?#{Map.put(query_map, :from, new_from)}"
  end
end
