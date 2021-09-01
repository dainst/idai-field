defmodule Api.Worker.Services.ResultHandler do
  require Logger

  alias HTTPoison.Response
  alias HTTPoison.Error

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
      _ -> Logger.error "(Services.ResultHandler.handle_result) Got HTTP Error for request: #{request.url}, response: #{inspect body}"
           nil
    end
  end
  def handle_result({:error, %Error{reason: reason}}) do

    Logger.error "API call failed, reason: #{inspect reason}"
    nil
  end
end
