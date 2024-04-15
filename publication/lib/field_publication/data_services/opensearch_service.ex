defmodule FieldPublication.DataServices.OpensearchService do
  require Logger
  @base_url Application.compile_env(:field_publication, :opensearch_url)

  @doc """
  Post a document

  Returns `{:ok, Finch.Response.t()}` or `{:error, Exception.t()}` for the post attempt. See the https://docs.couchdb.org for possible responses.

  __Parameters__
  - `doc`, the document that should be added to the database.
  - `database_name` (optional), the document's database.
  """
  def put(index_alias, doc, use_inactive \\ true) do
    url =
      if use_inactive do
        "#{@base_url}/#{get_inactive_index(index_alias)}/_doc/#{doc["id"]}"
      else
        "#{@base_url}/#{index_alias}/_doc/#{doc["id"]}"
      end

    Finch.build(
      :post,
      url,
      headers(),
      Jason.encode!(doc)
    )
    |> Finch.request(FieldPublication.Finch)
  end

  def initialize_indices_for_alias(index_alias) do
    {:ok, %{status: code}} =
      Finch.build(
        :put,
        "#{@base_url}/#{index_alias}__a__",
        headers()
      )
      |> Finch.request(FieldPublication.Finch)

    Finch.build(
      :put,
      "#{@base_url}/#{index_alias}__b__",
      headers()
    )
    |> Finch.request(FieldPublication.Finch)

    case code do
      200 ->
        Logger.debug("Indices have been newly created, setting alias #{index_alias}.")
        switch_active_index(index_alias)

      400 ->
        Logger.debug("Indices already existing.")
    end
  end

  def delete_index(index_alias) do
    Finch.build(
      :delete,
      "#{@base_url}/#{index_alias}",
      headers()
    )
    |> Finch.request(FieldPublication.Finch)
  end

  def clear_inactive_index(index_alias) do
    inactive_index_name =
      case get_active_index(index_alias) do
        :none ->
          "#{index_alias}__a__"

        val ->
          if String.ends_with?(val, "__a__") do
            "#{index_alias}__b__"
          else
            "#{index_alias}__a__"
          end
      end

    Finch.build(
      :delete,
      "#{@base_url}/#{inactive_index_name}",
      headers()
    )
    |> Finch.request(FieldPublication.Finch)

    Finch.build(
      :put,
      "#{@base_url}/#{inactive_index_name}",
      headers()
    )
    |> Finch.request(FieldPublication.Finch)
  end

  def switch_active_index(index_alias) do
    old = get_active_index(index_alias)

    new =
      case old do
        :none ->
          "#{index_alias}__a__"

        val ->
          if String.ends_with?(val, "__a__") do
            "#{index_alias}__b__"
          else
            "#{index_alias}__a__"
          end
      end

    payload =
      %{
        actions: [
          %{add: %{index: new, alias: index_alias}}
        ]
      }

    payload =
      if old != :none do
        Map.update!(payload, :actions, fn existing ->
          existing ++ [%{remove: %{index: old, alias: index_alias}}]
        end)
      else
        payload
      end

    Finch.build(
      :post,
      "#{@base_url}/_aliases",
      headers(),
      Jason.encode!(payload)
    )
    |> Finch.request(FieldPublication.Finch)
  end

  def get_inactive_index(index_alias) when is_binary(index_alias) do
    index_alias
    |> get_active_index()
    |> case do
      :none ->
        "#{index_alias}__a__"

      val ->
        if String.ends_with?(val, "__a__") do
          "#{index_alias}__b__"
        else
          "#{index_alias}__a__"
        end
    end
  end

  def get_active_index(index_alias) when is_binary(index_alias) do
    Finch.build(
      :get,
      "#{@base_url}/_alias/#{index_alias}",
      headers()
    )
    |> Finch.request(FieldPublication.Finch)
    |> case do
      {:ok, %{status: 200, body: body}} ->
        Jason.decode!(body)
        |> Map.keys()
        |> List.first()

      _ ->
        :none
    end
  end

  def get_doc_count(index_name) do
    Finch.build(
      :get,
      "#{@base_url}/#{index_name}/_count",
      headers()
    )
    |> Finch.request(FieldPublication.Finch)
    |> then(fn {:ok, %{status: 200, body: body}} ->
      Jason.decode!(body)
      |> Map.get("count", 0)
    end)
  end

  defp headers() do
    credentials =
      "admin:admin"
      |> Base.encode64()

    [
      {"Content-Type", "application/json"},
      {"Authorization", "Basic #{credentials}"}
    ]
  end
end
