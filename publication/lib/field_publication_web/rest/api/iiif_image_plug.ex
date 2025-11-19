defmodule FieldPublicationWeb.Api.IIIFImage do
  use IIIFImagePlug.V3

  alias IIIFImagePlug.V3.{
    DataRequestMetadata,
    InfoRequestMetadata,
    RequestError
  }

  alias FieldPublicationWeb.Endpoint

  @response_headers Application.compile_env(:field_publication, :iiif_response_headers, [])

  @impl true
  def data_metadata(identifier) do
    path = identifier_to_path(identifier)

    if File.exists?(path) do
      {:ok,
       %DataRequestMetadata{
         path: path,
         response_headers: @response_headers
       }}
    else
      {:error, %RequestError{status_code: 404, msg: :no_image_data_found}}
    end
  end

  @impl true
  def info_metadata(identifier) do
    path = identifier_to_path(identifier)

    if File.exists?(path) do
      {:ok,
       %InfoRequestMetadata{
         path: path,
         response_headers: @response_headers
       }}
    else
      {:error, %RequestError{status_code: 404, msg: :not_found}}
    end
  end

  @impl true
  def scheme() do
    Endpoint.config(:url)
    |> Enum.find(fn {key, _val} -> key == :scheme end)
    |> case do
      {:scheme, scheme} ->
        scheme

      _ ->
        "http"
    end
  end

  @impl true
  def host() do
    Endpoint.config(:url)
    |> Enum.find(fn {key, _val} -> key == :host end)
    |> case do
      {:host, host} ->
        host

      _ ->
        Endpoint.host()
    end
  end

  @impl true
  def port() do
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

  @impl true
  def send_error(conn, 404, :no_image_data_found) do
    send_file(
      conn,
      404,
      Application.app_dir(:field_publication, "priv/static/images/image_not_found.png")
    )
  end

  defp identifier_to_path(identifier) do
    [project, uuid] =
      URI.decode(identifier)
      |> String.split("/")

    "#{FieldPublication.FileService.get_web_images_path(project)}/#{uuid}.tif"
  end
end
