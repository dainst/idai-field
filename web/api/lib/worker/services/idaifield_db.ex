defmodule Api.Worker.Services.IdaiFieldDb do
  alias Api.Core.CorePropertiesAtomizing
  alias Api.Worker.Services.ResultHandler
  require Logger

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

    "#{url}/#{db}/_all_docs?include_docs=true"
    |> send_request(auth)
    |> get_in(["rows"])
    |> CorePropertiesAtomizing.format_changes
    |> update_in([Access.all(), :doc], &(Map.drop(&1, [:_id, :_rev, :_attachments])))
  end

  defp send_request url, auth do
    url
    |> HTTPoison.get(%{}, auth)
    |> ResultHandler.handle_result
  end

  defp get_connection_data do
    {
      [hackney: [basic_auth: {
            Api.Core.Config.get(:couchdb_user),
            Api.Core.Config.get(:couchdb_password)}]],
      Api.Core.Config.get(:couchdb_url)
    }
  end
end
