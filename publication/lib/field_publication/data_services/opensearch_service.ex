defmodule FieldPublication.OpenSearchService do
  alias FieldPublication.Publications.Search.SearchDocument
  require Logger

  def create_index(index_name) when is_binary(index_name) do
    Logger.info("Creating index '#{index_name}'.")

    Finch.build(
      :put,
      "#{base_url()}/#{index_name}",
      headers()
    )
    |> Finch.request(FieldPublication.Finch)
  end

  def create_index(index_name, index_mapping)
      when is_binary(index_name) and is_map(index_mapping) do
    Logger.info("Creating index '#{index_name}' with mapping.")

    Finch.build(
      :put,
      "#{base_url()}/#{index_name}",
      headers(),
      Jason.encode!(index_mapping)
    )
    |> Finch.request(FieldPublication.Finch)
  end

  def delete_index(index_name) when is_binary(index_name) do
    Logger.info("Deleting index '#{index_name}'.")

    Finch.build(
      :delete,
      "#{base_url()}/#{index_name}",
      headers()
    )
    |> Finch.request(FieldPublication.Finch)
  end

  def set_alias(index_name, alias_name) when is_binary(index_name) and is_binary(alias_name) do
    Logger.info("Setting alias '#{alias_name}' for '#{index_name}'.")

    Finch.build(
      :post,
      "#{base_url()}/_aliases",
      headers(),
      Jason.encode!(%{actions: [%{add: %{index: index_name, alias: alias_name}}]})
    )
    |> Finch.request(FieldPublication.Finch)
  end

  def remove_alias(index_name, alias_name) when is_binary(index_name) and is_binary(alias_name) do
    Logger.info("Removing alias '#{alias_name}' for '#{index_name}'.")

    Finch.build(
      :post,
      "#{base_url()}/_aliases",
      headers(),
      Jason.encode!(%{actions: [%{remove: %{index: index_name, alias: alias_name}}]})
    )
    |> Finch.request(FieldPublication.Finch)
  end

  def get_indices_behind_alias(alias_name) when is_binary(alias_name) do
    Finch.build(
      :get,
      "#{base_url()}/_alias/#{alias_name}",
      headers()
    )
    |> Finch.request(FieldPublication.Finch)
    |> case do
      {:ok, %{status: 200, body: body}} ->
        Jason.decode!(body)
        |> Map.keys()

      _ ->
        []
    end
  end

  def insert_document(%SearchDocument{} = doc, index_name) when is_binary(index_name) do
    Finch.build(
      :post,
      "#{base_url()}/#{index_name}/_doc/#{doc["id"]}",
      headers(),
      Jason.encode!(doc)
    )
    |> Finch.request(FieldPublication.Finch)
  end

  def insert_documents(docs, index_name) when is_list(docs) and is_binary(index_name) do
    payload =
      Enum.map(docs, fn %SearchDocument{} = doc ->
        "#{Jason.encode!(%{index: %{_index: index_name, _id: doc.id}})}\n#{Jason.encode!(doc)}\n"
      end)
      |> Enum.join()

    Finch.build(
      :post,
      "#{base_url()}/#{index_name}/_bulk",
      headers(),
      payload
    )
    |> Finch.request(FieldPublication.Finch)
  end

  def get_mapping(index_name) when is_binary(index_name) do
    Finch.build(
      :get,
      "#{base_url()}/#{index_name}/_mapping",
      headers()
    )
    |> Finch.request(FieldPublication.Finch)
  end

  def get_doc_count(index_name) when is_binary(index_name) do
    Finch.build(
      :get,
      "#{base_url()}/#{index_name}/_count",
      headers()
    )
    |> Finch.request(FieldPublication.Finch)
    |> then(fn {:ok, %{status: 200, body: body}} ->
      Jason.decode!(body)
      |> Map.get("count", 0)
    end)
  end

  def run_query(index_name, query) when is_binary(index_name) and is_map(query) do
    Finch.build(
      :post,
      "#{base_url()}/#{index_name}/_search",
      headers(),
      Jason.encode!(query)
    )
    |> Finch.request(FieldPublication.Finch)
  end

  defp headers() do
    pw = Application.get_env(:field_publication, :opensearch_admin_password)

    credentials =
      "admin:#{pw}"
      |> Base.encode64()

    [
      {"Content-Type", "application/json"},
      {"Authorization", "Basic #{credentials}"}
    ]
  end

  defp base_url() do
    Application.get_env(:field_publication, :opensearch_url)
  end

  @invalid_chars [":", "\"", "*", "+", "/", "\\", "|", "?", "#", ">", "<"]
  # See https://opensearch.org/docs/2.14/api-reference/index-apis/create-index/#index-naming-restrictions
  def encode_chars(index_name) do
    result = String.downcase(index_name)

    Enum.reduce(@invalid_chars, result, fn char, current ->
      String.replace(current, char, "_")
    end)
  end
end
