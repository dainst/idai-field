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
    Endpoint.config(:url)
    |> Enum.find(fn {key, _val} -> key == :scheme end)
    |> case do
      {:scheme, scheme} ->
        scheme

      _ ->
        "http"
    end
  end

  def get_endpoint_host() do
    Endpoint.config(:url)
    |> Enum.find(fn {key, _val} -> key == :host end)
    |> case do
      {:host, host} ->
        host

      _ ->
        Endpoint.host()
    end
  end

  def get_endpoint_port() do
    Endpoint.config(:url)
    |> Enum.find(fn {key, _val} -> key == :port end)
    |> case do
      {:port, port} ->
        port

      _ ->
        Endpoint.config(:http)
        |> Enum.find(fn {key, _val} -> key == :port end)
        |> case do
          {:port, port} ->
            port

          _ ->
            nil
        end
    end
  end
end
