defmodule Api.Worker.Services.Gazetteer do
  alias Api.Worker.Services.ResultHandler
  require Logger

  def get_place(gazetteer_id) do
    HTTPoison.get("#{Api.Core.Config.get(:gazetteer_url)}/doc/#{gazetteer_id}.json")
    |> ResultHandler.handle_result
  end
end
