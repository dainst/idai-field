defmodule FieldPublicationWeb.Presentation.SearchLive do
  use FieldPublicationWeb, :live_view

  alias FieldPublication.Publications.Search

  alias FieldPublicationWeb.Presentation.Components.{
    DocumentLink
  }

  def handle_params(%{"q" => q} = params, _uri, socket) do
    filters = Map.get(params, "filters", %{})

    {
      :noreply,
      socket
      |> assign(:query, q)
      |> assign(:filters, filters)
      |> assign(:search_results, Search.fuzzy_search(q, filters))
    }
  end

  def handle_params(params, _uri, socket) do
    q = Map.get(params, "q", "*")
    filters = Map.get(params, "filters", %{})

    new_params = %{query: q, filters: filters}

    {
      :noreply,
      push_patch(socket,
        to: ~p"/search?#{new_params}"
      )
    }
  end

  def handle_event(
        "search",
        %{"search_input" => input_value},
        %{assigns: assigns} = socket
      ) do
    filters = Map.get(assigns, :filters, %{})

    {
      :noreply,
      push_patch(socket,
        to: ~p"/search?#{%{q: input_value, filters: filters}}"
      )
    }
  end

  def handle_event(
        "toggle_filter",
        %{"key" => key, "value" => value},
        %{assigns: %{query: q} = assigns} = socket
      ) do
    toggled_param = {key, value}

    filters = Map.get(assigns, :filters, %{})

    updated_filters =
      if toggled_param in filters do
        Enum.reject(filters, fn {field, _value} -> field == key end)
      else
        Map.put(filters, key, value)
      end

    {
      :noreply,
      push_patch(socket,
        to: ~p"/search?#{%{q: q, filters: updated_filters}}"
      )
    }
  end

  def aggregation_selection(assigns) do
    ~H"""
    <h2><%= @field_name %></h2>
    <%= for %{count: count, key: key} <- @buckets do %>
      <div
        class="pl-2 cursor-pointer hover:bg-slate-200 rounded"
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
      class="pl-2 cursor-pointer bg-[#5882c2] hover:bg-slate-200 hover:line-through rounded"
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
