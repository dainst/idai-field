defmodule Api.Images.CantaloupeImagesAdapter do
  require Logger
  use Tesla
  plug Tesla.Middleware.BaseUrl, Api.Core.Config.get(:cantaloupe_url)
  adapter Tesla.Adapter.Ibrowse

  def info(project, id) do
    cantaloupe_url = "#{project}%2F#{id}/info.json"
    result = get(cantaloupe_url)
    case result do
      {:ok, %{ body: image_info, status: 200 }} -> {:ok, image_info}
      {:ok, %{ body: _, status: 404 }} -> {:error, :not_found}
      {:ok, %{ body: error, status: _status }} -> {:error, error}
      other -> Logger.error ": #{inspect other}"; {:error, "Unknown error (see server logs)"}
    end
  end

  def get(project, id, cantaloupe_params) do
    cantaloupe_url = "#{project}%2F#{URI.encode_www_form(id)}/#{cantaloupe_params}"
    result = get(cantaloupe_url)
    case result do
      {:ok, %{ body: image_data, status: 200 }} -> {:ok, image_data}
      {:ok, %{ body: _, status: 404 }} -> {:error, :not_found}
      {:ok, %{ body: error, status: _status }} -> {:error, error}
      other -> Logger.error ": #{inspect other}"; {:error, "Unknown error (see server logs)"}
    end
  end
end
