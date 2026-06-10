defmodule FieldPublicationWeb.Presentation.Components.Search do
  use FieldPublicationWeb, :html

  import FieldPublicationWeb.Components.Data.DocumentLink

  alias FieldPublication.Publications.Search
  alias FieldPublication.Publications.Search.SearchDocument

  attr :current_query, :string, required: true
  attr :total, :integer, required: true
  attr :active_filters, :map, default: %{}
  attr :active_geo_search?, :boolean, default: false

  def search_input(assigns) do
    ~H"""
    <form
      phx-change="search"
      phx-submit="search"
      class="pb-2"
    >
      <input
        class="w-full border p-2"
        type="text"
        value={@current_query}
        name="search_input"
        phx-debounce="100"
      />
    </form>
    <section>
      <div>
        <%= if @total < 10000 do %>
          Found {@total} matches.
        <% else %>
          Found more than 10000 matches.
        <% end %>
        <%= if @active_filters != %{} do %>
          Active filters:
        <% end %>
      </div>
      <%= if @active_filters != %{} do %>
        <div class="flex flex-wrap gap-1">
          <div
            :if={@active_geo_search?}
            class="pl-2 text-primary-inverse hover:text-primary-hover-inverse cursor-pointer bg-primary hover:bg-primary-hover hover:line-through rounded"
            phx-click="clear_geo_filter"
          >
            <div class="h-full pl-2 pr-2 font-thin rounded">
              <strong><.icon name="hero-map" /></strong> Map selection
            </div>
          </div>
          <%= for {field, value} <- @active_filters do %>
            <.aggregation_deselection
              field_name={field}
              value={value}
            />
          <% end %>
        </div>
      <% end %>
    </section>
    """
  end

  attr(:active_filters, :map, default: %{})
  attr(:available_filters, :map, required: true)
  slot :inner_block, required: true
  slot :active_heading
  slot :available_heading, required: true

  def filter_list(assigns) do
    ~H"""
    <%= if @active_filters != %{} do %>
      {render_slot(@active_heading)}
      <div class="p-1 flex flex-col gap-0.5">
        <%= for {field, value} <- @active_filters do %>
          <.aggregation_deselection
            field_name={field}
            value={value}
          />
        <% end %>
      </div>
    <% end %>

    {render_slot(@available_heading)}
    <div class="p-1">
      <%= for {field, buckets} <- @available_filters do %>
        <.aggregation_selection
          field_name={field}
          buckets={buckets}
        />
      <% end %>
    </div>
    """
  end

  attr(:total, :integer, required: true)
  attr(:docs, :list, required: true)
  attr(:limit, :integer, required: true)
  attr(:query_params, :map, required: true)
  attr(:map_indicators?, :boolean, default: false)
  attr(:map_hover_target, :string, default: nil)
  attr(:base_url, :string, required: true)

  def result_list(assigns) do
    ~H"""
    <div class="w-full">
      <div class="flex flex-row mb-2 sticky top-0">
        <% previous_from =
          if @query_params.from - @limit > 0,
            do: @query_params.from - @limit,
            else: 0 %>
        <.link
          class={"p-2 #{if @query_params.from == 0, do: "bg-zinc-700 cursor-default border-(--primary-color)", else: "bg-(--primary-color) hover:bg-(--primary-color-hover)"}"}
          patch={"#{@base_url}?#{Plug.Conn.Query.encode(Map.put(@query_params, :from, previous_from))}"}
        >
          <span class="text-white">
            Previous
          </span>
        </.link>
        <div class="bg-white grow p-2 border-t border-b border-(--primary-color) text-center">
          Showing {@query_params.from + 1} - {if @query_params.from + @limit > @total,
            do: @total,
            else: @query_params.from + @limit} of {@total} results
        </div>
        <% next_from =
          if @query_params.from + @limit >= @total,
            do: @query_params.from,
            else: @query_params.from + @limit %>
        <.link
          class={"p-2 #{if next_from == @query_params.from, do: "bg-zinc-700 cursor-default", else: "bg-(--primary-color) hover:bg-(--primary-color-hover)"} text-white"}
          patch={"#{@base_url}?#{Plug.Conn.Query.encode(Map.put(@query_params, :from, next_from))}"}
        >
          <span class="text-white">
            Next
          </span>
        </.link>
      </div>
      <div :for={%SearchDocument{full_doc: doc} <- @docs}>
        <.document_link
          id={doc.id}
          geometry_indicator={@map_indicators?}
          doc={doc}
          image_count={10}
          image_height={128}
          hover_target={@map_hover_target}
          publication_search?={!String.starts_with?(@base_url, ~p"/search")}
        />
      </div>
    </div>
    """
  end

  def aggregation_selection(assigns) do
    ~H"""
    <details>
      <summary class="cursor-pointer italic">
        {render_label(get_filter_label(@field_name))}
      </summary>
      <div class="pl-2 max-h-96 overflow-y-auto">
        <%= for %{count: count, key: key} <- @buckets do %>
          <div
            class="pl-2 mt-1 cursor-pointer border border-gray-100 hover:border-primary rounded"
            phx-click="toggle_filter"
            phx-value-key={@field_name}
            phx-value-value={key}
          >
            <div class="flex pl-2 pr-2 font-thin rounded">
              <span class="grow mr-2">{render_label(get_filter_value_label(@field_name, key))}</span>
              ({count})
            </div>
          </div>
        <% end %>
      </div>
    </details>
    """
  end

  def aggregation_deselection(assigns) do
    ~H"""
    <div
      class="pl-2 text-primary-inverse hover:text-primary-hover-inverse cursor-pointer bg-primary hover:bg-primary-hover hover:line-through rounded"
      phx-click="toggle_filter"
      phx-value-key={@field_name}
      phx-value-value={@value}
    >
      <div class="h-full pl-2 pr-2 font-thin rounded">
        <strong>{render_label(get_filter_label(@field_name))}:</strong> {render_label(
          get_filter_value_label(
            @field_name,
            @value
          )
        )}
      </div>
    </div>
    """
  end

  def render_label(%{secondary: _secondary} = assigns) do
    ~H"""
    <div class="relative group">
      <span class="thin hero-information-circle mb-1"></span>
      {@primary}
      <div class="p-2 mt-1 w-full z-10 bg-yellow-100 hidden group-hover:block absolute">
        <span class="font-semibold">Varying usage:</span>
        <%= for {text, _count, projects} <- @secondary do %>
          <div>
            {text} <span class="italic">({Enum.join(projects, ", ")})</span>
          </div>
        <% end %>
      </div>
    </div>
    """
  end

  def render_label(assigns) do
    ~H"""
    {@primary}
    """
  end

  defp get_filter_label("project_key") do
    %{primary: Gettext.gettext(FieldPublicationWeb.Translate, "Project")}
  end

  defp get_filter_label(opensearch_field_name) do
    data_field_name = String.replace_suffix(opensearch_field_name, "_keyword", "")

    label_info = Search.get_system_wide_label_usage()

    case label_info[:field_labels][data_field_name]["labels"] do
      nil ->
        opensearch_field_name

      labels ->
        Map.get(
          labels,
          Gettext.get_locale(FieldPublicationWeb.Translate),
          data_field_name
        )
    end
    |> case do
      [{text, _count, _projects}] ->
        %{primary: text}

      [{text, _count, _projects} = _primary | rest] ->
        %{primary: text, secondary: rest}

      some_string when is_binary(some_string) ->
        %{primary: some_string}
    end
  end

  defp get_filter_value_label("category", opensearch_field_value) do
    label_info = Search.get_system_wide_label_usage()

    case label_info[:category_labels][opensearch_field_value] do
      nil ->
        opensearch_field_value

      values ->
        Map.get(
          values,
          Gettext.get_locale(FieldPublicationWeb.Translate),
          opensearch_field_value
        )
    end
    |> case do
      [{text, _count, _projects}] ->
        %{primary: text}

      [{text, _count, _projects} = _primary | rest] ->
        %{primary: text, secondary: rest}

      text when is_binary(text) ->
        %{primary: text}
    end
  end

  defp get_filter_value_label(opensearch_field_name, opensearch_field_value) do
    label_info = Search.get_system_wide_label_usage()
    data_field_name = String.replace_suffix(opensearch_field_name, "_keyword", "")

    case label_info[:field_labels][data_field_name]["value_labels"] do
      nil ->
        opensearch_field_value

      empty_map when empty_map == %{} ->
        opensearch_field_value

      value_translations_mapping ->
        Map.get(value_translations_mapping, opensearch_field_value, opensearch_field_value)
    end
    |> case do
      some_string when is_binary(some_string) ->
        some_string

      value_labels ->
        Map.get(
          value_labels,
          Gettext.get_locale(FieldPublicationWeb.Translate),
          opensearch_field_value
        )
    end
    |> case do
      [{text, _count, _projects}] ->
        %{primary: text}

      [{text, _count, _projects} = _primary | rest] ->
        %{primary: text, secondary: rest}

      text when is_binary(text) ->
        %{primary: text}
    end
  end
end
