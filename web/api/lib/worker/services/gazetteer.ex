defmodule Api.Worker.Services.Gazetteer do
  require Logger

  alias HTTPoison.Response
  alias HTTPoison.Error

  def get_place(gazetteer_id) do
    HTTPoison.get("#{Api.Core.Config.get(:gazetteer_url)}/doc/#{gazetteer_id}.json")
    |> handle_result
  end

  defguard is_ok(status_code) when status_code >= 200 and status_code < 300

  defguard is_error(status_code) when status_code >= 400

  def handle_result({:ok, %Response{status_code: status_code, body: body}})
    when is_ok(status_code) do

    Poison.decode!(body)
  end
  def handle_result({:error, %Error{reason: reason}}) do
    Logger.error "Reason: #{inspect reason}"
    nil
  end
end
