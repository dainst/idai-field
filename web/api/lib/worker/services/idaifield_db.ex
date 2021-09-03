defmodule Api.Worker.Services.IdaiFieldDb do
  require Logger

  alias HTTPoison.Response
  alias HTTPoison.Error
  alias Api.Core.CorePropertiesAtomizing

  @batch_size 500

  @doc """
  returns nil if document not available
  """
  def get_doc(db), do: fn id -> get_doc(db, id) end
  def get_doc(db, id) do
    {auth, url} = get_connection_data()

    case send_request("#{url}/#{db}/#{id}", auth) do
      document = %{ "resource" => _resource } ->
        CorePropertiesAtomizing.format_document document
      nil ->
        nil
      unexpected ->
        Logger.error "(Services.IdaiFieldDb) Unexpected: #{inspect unexpected}"
        nil
    end
  end

  def fetch_changes db do
    {auth, url} = get_connection_data()

    result_length = "#{url}/#{db}/_all_docs"
    |> send_request(auth)
    |> get_in(["rows"])
    |> length

    Enum.to_list(0..div(result_length, @batch_size))
    |> Enum.map(fn idx -> idx * @batch_size end)
    |> Enum.flat_map(&(fetch_batch(auth, db, url, &1, @batch_size)))
    |> CorePropertiesAtomizing.format_changes
    |> update_in([Access.all(), :doc], &(Map.drop(&1, [:_id, :_rev, :_attachments])))
  end

  defp fetch_batch auth, db, url, batch_offset, batch_size do
    Logger.info "Fetching from \"#{db}\" - offset: #{batch_offset}"
    "#{url}/#{db}/_all_docs?include_docs=true&skip=#{batch_offset}&limit=#{batch_size}"
    |> send_request(auth)
    |> get_in(["rows"])
  end

  defp send_request url, auth do
    url
    |> HTTPoison.get(%{}, auth)
    |> handle_result
  end

  defp get_connection_data do
    {
      [hackney: [basic_auth: {
            Api.Core.Config.get(:couchdb_user),
            Api.Core.Config.get(:couchdb_password)}]],
      Api.Core.Config.get(:couchdb_url)
    }
  end

  defguard is_ok(status_code) when status_code >= 200 and status_code < 300

  defguard is_error(status_code) when status_code >= 400

  def handle_result({:ok, %Response{status_code: status_code, body: body}})
    when is_ok(status_code) do
    Poison.decode!(body)
  end
  def handle_result({:ok, %Response{status_code: status_code, body: body, request: request}})
    when is_error(status_code) do

    result = Poison.decode!(body)

    case result do
      %{ "error" => "not_found", "reason" => "deleted"} -> nil
      %{ "error" => "not_found", "reason" => "missing"} -> nil
      _ -> Logger.error "Got HTTP Error for request: #{request.url}, response: #{inspect body}"
           nil
    end
  end
  def handle_result({:error, %Error{reason: reason}}) do
    Logger.error "API call failed, reason: #{inspect reason}"
    nil
  end
end
