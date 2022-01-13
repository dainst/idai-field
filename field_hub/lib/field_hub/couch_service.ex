defmodule FieldHub.CouchService do

  @couch_url Application.get_env(:field_hub, :couchdb_root)

  def authenticate(project, user_name, user_password) do
    response =
      HTTPoison.get(
        "#{@couch_url}/#{project}",
        headers(user_name, user_password)
      )

    case response do
      {:ok, %{status_code: 200}} ->
        :ok
      {:ok, _} ->
        :error
      {:error, _} ->
        :error
    end
  end

  def headers(user_name, user_password) do
    credentials =
      "#{user_name}:#{user_password}"
      |> Base.encode64()

    [
      {"Content-Type", "application/json"},
      {"Authorization", "Basic #{credentials}"}
    ]
  end
end
