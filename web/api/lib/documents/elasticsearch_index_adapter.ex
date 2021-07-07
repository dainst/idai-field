defmodule Api.Documents.ElasticsearchIndexAdapter do
  require Logger

  defp get_base_url do
    "#{Api.Core.Config.get(:elasticsearch_url)}/#{Api.Core.Config.get(:elasticsearch_index_prefix)}_*"
  end

  def post_query query do
    HTTPoison.post("#{get_base_url()}/_search", query, [{"Content-Type", "application/json"}])
    |> handle_result
  end

  defp handle_result({:ok, %HTTPoison.Response{status_code: 200, body: body}}) do
    Poison.decode! body
  end
  defp handle_result({:ok, %HTTPoison.Response{status_code: 400, body: body}}) do
    Logger.error "Elasticsearch query failed with status 400! Response: #{inspect body}"
    %{error: "bad_request"}
  end
  defp handle_result({:error, %HTTPoison.Error{reason: reason}}) do
    Logger.error "Elasticsearch query failed! Reason: #{inspect reason}"
    %{error: "unknown"}
  end
end
