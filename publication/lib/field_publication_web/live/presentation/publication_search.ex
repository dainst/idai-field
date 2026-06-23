defmodule FieldPublicationWeb.Presentation.PublicationSearch do
  use FieldPublicationWeb, :live_view

  alias FieldPublication.Publications
  alias FieldPublication.Publications.Search
  alias FieldPublication.Publications.Data

  import FieldPublicationWeb.Presentation.Components.Search

  import FieldPublicationWeb.Components.Data.{
    Field
  }

  @search_batch_limit 20

  @impl true
  def mount(%{"draft_date" => draft_date, "project_id" => project_key}, _session, socket) do
    publication = Publications.get!(project_key, draft_date)

    project_document = Publications.Data.get_extended_document("project", publication, true)

    {
      :ok,
      socket
      |> assign(:page_title, "Searching '#{project_key}' (#{draft_date})")
      |> assign(:publication, publication)
      |> assign(:project_document, project_document)
    }
  end

  @impl true
  def handle_params(unsigned_params, _uri, %{assigns: %{publication: publication}} = socket) do
    q = Map.get(unsigned_params, "q", "*")
    filters = Map.get(unsigned_params, "filters", %{})

    from =
      Map.get(unsigned_params, "from", "0")
      |> Integer.parse()
      |> case do
        {val, ""} ->
          val

        _ ->
          0
      end

    parsed_geometry_filter =
      with values when is_binary(values) and values != "" <-
             Map.get(unsigned_params, "geometry_filter"),
           coordinates_params <- String.split(values, "_"),
           coordinates <- Enum.map(coordinates_params, &String.split(&1, "|")),
           parsed_values <-
             Enum.map(coordinates, fn [a, b] -> [Float.parse(a), Float.parse(b)] end),
           true <-
             Enum.all?(parsed_values, fn
               [{_a, ""}, {_b, ""}] -> true
               _ -> false
             end) do
        Enum.map(parsed_values, fn [{a, ""}, {b, ""}] -> [a, b] end)
      else
        _ ->
          nil
      end

    geometry_filter_parameter =
      if parsed_geometry_filter, do: Map.get(unsigned_params, "geometry_filter"), else: nil

    {
      :noreply,
      socket
      |> assign(:limit, @search_batch_limit)
      |> assign(:selected_geometry, parsed_geometry_filter)
      |> assign(:url_parameters, %{
        q: q,
        filters: filters,
        geometry_filter: geometry_filter_parameter,
        from: from
      })
      |> assign_async(:search_result, fn ->
        %{
          total: total,
          docs: docs,
          aggregations: aggregations
        } =
          Search.search(
            q,
            filters,
            parsed_geometry_filter,
            from,
            @search_batch_limit,
            publication
          )

        aggregations =
          Enum.reject(
            aggregations,
            fn
              # We do not want to provide a filter for the project itself, as we
              # are only ever having one value for the publication. This filter
              # is only useful in the system wide search at `/search`.
              {"project_key", _value} -> true
              _ -> false
            end
          )

        available_filters =
          Enum.reject(aggregations, fn {field, _buckets} ->
            Enum.find(filters, fn {already_filtered_field, _value} ->
              already_filtered_field == field
            end)
          end)

        {
          :ok,
          %{
            search_result: %{
              total: total,
              docs: docs,
              aggregations: aggregations,
              available_filters: available_filters
            }
          }
        }
      end)
    }
  end

  @impl true
  def handle_event(
        "search",
        %{"search_input" => input_value},
        %{assigns: %{url_parameters: parameters, publication: publication}} = socket
      ) do
    url_parameters =
      parameters
      |> Map.put(:q, input_value)
      |> Map.put(:from, 0)

    {
      :noreply,
      push_patch(
        socket,
        to:
          ~p"/projects/search/#{publication.project_name}/#{publication.draft_date}?#{url_parameters}"
      )
    }
  end

  def handle_event(
        "toggle_filter",
        %{"key" => key, "value" => value},
        %{assigns: %{url_parameters: url_parameters, publication: publication}} = socket
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
        to:
          ~p"/projects/search/#{publication.project_name}/#{publication.draft_date}?#{url_parameters}"
      )
    }
  end

  def handle_event(
        "clear_geo_filter",
        _,
        %{assigns: %{url_parameters: url_parameters, publication: publication}} = socket
      ) do
    url_parameters =
      url_parameters
      |> Map.delete(:geometry_filter)
      |> Map.put(:from, 0)

    {
      :noreply,
      push_patch(socket,
        to:
          ~p"/projects/search/#{publication.project_name}/#{publication.draft_date}?#{url_parameters}"
      )
    }
  end

  @impl true
  def handle_info(
        {:drawn_selection, values},
        %{assigns: %{url_parameters: url_parameters, publication: publication}} = socket
      ) do
    url_parameters =
      url_parameters
      |> Map.merge(drawn_selection_to_parameter(values))
      |> Map.put(:from, 0)

    {
      :noreply,
      push_patch(socket,
        to:
          ~p"/projects/search/#{publication.project_name}/#{publication.draft_date}?#{url_parameters}"
      )
    }
  end

  def drawn_selection_to_parameter(geometry) do
    %{
      geometry_filter:
        Enum.reduce(geometry, "", fn [x, y], acc ->
          "#{acc}_#{x}|#{y}"
        end)
        |> String.replace_prefix("_", "")
    }
  end
end
