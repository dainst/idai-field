defmodule FieldPublication.Chronology do
  import Tempo.Sigils

  alias FieldPublication.DatabaseSchema.Publication
  alias FieldPublication.Publications
  alias FieldPublication.Publications.Data

  alias Tempo.Network

  require Logger

  @relevant_relations ["isAbove", "isBelow", "liesWithin"]

  def create_meninx() do
    [meninx] = Publications.list("meninx")

    create_chronology_network(meninx)
  end

  def create_chronology_network(%Publication{} = publication) do
    # What denotes a period? A resource having a date is probably not right.
    #
    # If sequences are defined by isAbove/isBelow relations, then each layer should maybe
    # evaluate its own dating based on the dating of the resources that are "liesWithin" connected
    # to the layer?
    Network.new()
    |> create_periods(publication)

    # |> create_sequences(publication)
    # |> create_relations(publication)
  end

  def create_periods(%Tempo.Network{} = network, %Publication{} = publication) do
    FieldPublication.Publications.Data.get_doc_stream_for_all(publication)
    |> Stream.filter(fn doc ->
      get_in(doc, ["resource", "relations"])
      |> case do
        nil ->
          false

        relations_map ->
          relations_map
          |> Map.keys()
          |> Enum.any?(fn key -> key in @relevant_relations end)
      end
    end)
    |> Enum.reduce(network, fn doc, network ->
      get_in(doc, ["resource", "dating"])
      |> case do
        nil ->
          {nil, nil}

        [%{"begin" => %{"year" => begin_year}, "end" => %{"year" => end_year}}] ->
          {begin_year, end_year}

        [%{"begin" => %{"year" => begin_year}}] ->
          {begin_year, nil}

        [%{"end" => %{"year" => end_year}}] ->
          {nil, end_year}

        other ->
          Logger.debug("Unhandled dating: #{inspect(other)}")
          {nil, nil}
      end
      |> case do
        {nil, nil} ->
          Network.add_period(
            network,
            doc["_id"],
            name: doc["resource"]["identifier"]
          )

        {begin_year, nil} ->
          Network.add_period(
            network,
            doc["_id"],
            name: doc["resource"]["identifier"],
            start: {:not_before, Tempo.from_iso8601!("#{begin_year}Y")}
          )

        {nil, end_year} ->
          Network.add_period(
            network,
            doc["_id"],
            name: doc["resource"]["identifier"],
            end: {:not_after, Tempo.from_iso8601!("#{end_year}Y")}
          )

        {begin_year, end_year} ->
          Network.add_period(
            network,
            doc["_id"],
            name: doc["resource"]["identifier"],
            start: {:not_before, Tempo.from_iso8601!("#{begin_year}Y")},
            end: {:not_after, Tempo.from_iso8601!("#{end_year}Y")}
          )
      end
    end)
  end

  def create_sequences(%Tempo.Network{} = network, %Publication{} = publication) do
    lookup =
      FieldPublication.Publications.Data.get_doc_stream_for_all(publication)
      |> Enum.reduce(%{}, fn %{"_id" => uuid} = doc, acc ->
        acc =
          get_in(doc, ["resource", "relations", "isAbove"])
          |> case do
            nil ->
              acc

            uuids when is_list(uuids) ->
              Map.update(acc, uuid, %{above: uuids}, fn existing ->
                Map.put(existing, :above, uuids)
              end)
          end

        acc =
          get_in(doc, ["resource", "relations", "isBelow"])
          |> case do
            nil ->
              acc

            uuids when is_list(uuids) ->
              Map.update(acc, uuid, %{below: uuids}, fn existing ->
                Map.put(existing, :below, uuids)
              end)
          end

        acc
      end)

    Stream.filter(lookup, fn {_uuid, relations} ->
      Map.has_key?(relations, :above) && !Map.has_key?(relations, :below)
    end)
    |> Stream.map(fn {root_uuid, _} ->
      []
      |> accumulate_sequence(root_uuid, lookup)
      |> flatten_nested_list()
    end)
    |> Stream.concat()
    |> Enum.reduce(network, fn sequence, network ->
      Tempo.Network.add_sequence(network, sequence)
    end)
  end

  defp accumulate_sequence(sequence, uuid, lookup) do
    get_in(lookup, [uuid, :above])
    |> case do
      nil ->
        sequence ++ [uuid]

      below_uuids ->
        Enum.map(below_uuids, fn next_uuid ->
          accumulate_sequence(sequence ++ [uuid], next_uuid, lookup)
        end)
    end
  end

  defp flatten_nested_list(list) do
    Enum.all?(list, fn val -> is_binary(val) end)
    |> if do
      list
    else
      {finished, maybe_partially_finished} =
        Enum.split_with(list, fn val ->
          Enum.all?(val, fn val -> is_binary(val) end)
        end)

      {finished_b, further_nesting} =
        Enum.split_with(maybe_partially_finished, fn partial ->
          Enum.all?(partial, fn val -> is_binary(val) end)
        end)

      flattened = Enum.concat(further_nesting)

      finished ++ finished_b ++ flatten_nested_list(flattened)
    end
  end

  def create_relations(%Tempo.Network{} = network, %Publication{} = publication) do
    FieldPublication.Publications.Data.get_doc_stream_for_all(publication)
    |> Enum.to_list()
    |> Enum.reduce(network, fn %{"_id" => uuid} = doc, acc ->
      get_in(doc, ["resource", "relations", "liesWithin"])
      |> case do
        nil ->
          acc

        values ->
          Enum.reduce(values, acc, fn relation_uuid, inner_acc ->
            Tempo.Network.add_relation(
              inner_acc,
              :included_in,
              relation_uuid,
              uuid
            )
          end)
      end
    end)
  end
end
