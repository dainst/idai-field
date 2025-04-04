defmodule FieldPublicationWeb.IIIFHelper do
  alias FieldPublicationWeb.Endpoint

  def identifier_to_path(identifier) do
    [project, uuid] =
      URI.decode(identifier)
      |> String.split("/")

    "#{FieldPublication.FileService.get_web_images_path(project)}/#{uuid}.tif"
  end

  def handle_404(conn, plug_info) do
    response_body =
      if Plug.Conn.request_url(conn) |> String.ends_with?(".json") do
        Jason.encode!(plug_info)
      else
        File.read!(
          Application.app_dir(:field_publication, "priv/static/images/image_not_found.png")
        )
      end

    Plug.Conn.resp(
      conn,
      404,
      response_body
    )
  end

  def get_endpoint_scheme() do
    get_endpoint_config(:scheme)
  end

  def get_endpoint_host() do
    get_endpoint_config(:host)
  end

  def get_endpoint_port() do
    get_endpoint_config(:port)
  end

  defp get_endpoint_config(key) do
    Application.get_env(:field_publication, Endpoint)
    |> Enum.into(%{})
    |> get_in([:url, key])
    |> case do
      nil ->
        nil

      value ->
        value
    end
  end
end
