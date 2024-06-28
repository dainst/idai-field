defmodule FieldPublicationWeb.Presentation.SearchLive do
  use FieldPublicationWeb, :live_view

  alias FieldPublication.Publications.Search

  alias FieldPublicationWeb.Presentation.Components.{
    DocumentLink
  }

  @search_batch_limit 20

  def mount(_params, _session, socket) do
    {:ok, assign(socket, :page_title, "Search")}
  end

  def handle_params(params, _uri, socket) do
    q = Map.get(params, "q", "*")
    filters = Map.get(params, "filters", %{})

    from = 0

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
      :noreply,
      socket
      |> assign(:url_parameters, %{q: q, filters: filters})
      |> assign(:from, from)
      |> assign(:search_end_reached, false)
      |> assign(:aggregations, aggregations)
      |> assign(:total, total)
      |> stream(:search_results, docs, reset: true)
    }
  end

  def handle_event("search_next_batch", _, %{assigns: %{search_end_reached: true}} = socket) do
    {
      :noreply,
      socket
    }
  end

  def handle_event(
        "search_next_batch",
        _,
        %{assigns: %{url_parameters: parameters, from: from}} = socket
      ) do
    %{
      docs: docs
    } =
      Search.search(
        parameters.q,
        parameters.filters,
        from,
        @search_batch_limit
      )

    {
      :noreply,
      socket
      |> assign(:from, from + @search_batch_limit)
      |> assign(:search_end_reached, docs == [])
      |> stream(:search_results, docs)
    }
  end

  def handle_event(
        "search",
        %{"search_input" => input_value},
        %{assigns: %{url_parameters: parameters}} = socket
      ) do
    url_parameters = Map.put(parameters, :q, input_value)

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

    url_parameters = Map.put(url_parameters, :filters, updated_filters)

    {
      :noreply,
      push_patch(socket,
        to: ~p"/search?#{url_parameters}"
      )
    }
  end

  def aggregation_selection(assigns) do
    ~H"""
    <strong><%= @field_name %></strong>
    <%= for %{count: count, key: key} <- @buckets do %>
      <div
        class="pl-2 mt-1 cursor-pointer hover:bg-slate-200 rounded"
        phx-click="toggle_filter"
        phx-value-key={@field_name}
        phx-value-value={key}
      >
        <div class="h-full pl-2 pr-2 font-thin rounded">
          <%= key %> (<%= count %>)
        </div>
      </div>
    <% end %>
    """
  end

  def aggregation_deselection(assigns) do
    ~H"""
    <div
      class="pl-2 mt-1 cursor-pointer bg-[#5882c2] hover:bg-slate-200 hover:line-through rounded"
      phx-click="toggle_filter"
      phx-value-key={@field_name}
      phx-value-value={@value}
    >
      <div class="h-full pl-2 pr-2 font-thin rounded">
        <%= @value %>
      </div>
    </div>
    """
  end
end
