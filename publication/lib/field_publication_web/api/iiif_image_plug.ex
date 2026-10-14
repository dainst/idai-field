defmodule FieldPublicationWeb.Api.IIIFImage do
  use IIIFImagePlug.V3

  alias IIIFImagePlug.V3.{
    DataRequestMetadata,
    InfoRequestMetadata,
    RequestError
  }

  alias FieldPublicationWeb.Endpoint
  alias FieldPublication.FileService

  @response_headers Application.compile_env(:field_publication, :iiif_response_headers, [])

  @impl true
  def data_call(conn) do
    path = get_image_cache_path(conn)

    if File.exists?(path) do
      conn =
        Enum.reduce(@response_headers, conn, fn {key, value}, conn ->
          Plug.Conn.put_resp_header(conn, key, value)
        end)

      {
        :stop,
        Plug.Conn.send_file(conn, 200, path)
      }
    else
      {:continue, conn}
    end
  end

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
  def data_response(
        %Plug.Conn{path_info: [_id, region | _rest]} = conn,
        %Vix.Vips.Image{} = image,
        _format
      ) do
    if Vix.Vips.Image.width(image) <= 250 && Vix.Vips.Image.height(image) <= 250 &&
         region == "full" do
      path = get_image_cache_path(conn)

      path
      |> Path.dirname()
      |> File.mkdir_p!()

      Vix.Vips.Image.write_to_file(image, path)

      conn =
        Enum.reduce(@response_headers, conn, fn {key, value}, conn ->
          Plug.Conn.put_resp_header(conn, key, value)
        end)

      {:stop, send_file(conn, 200, path)}
    else
      {:continue, conn}
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

  @identifier_joiner "|"

  @doc "
  Combines project identifier and uuid to a identifier string that can be used in the IIIF API.
  "
  def combine_to_identifier(project_identifier, uuid)
      when is_binary(project_identifier) and is_binary(uuid) do
    Enum.join([project_identifier, uuid], @identifier_joiner)
  end

  @doc "
  Splits project identifier and uuid from a identifier string that is beeing used in the IIIF API.
  "
  def split_identifier(identifier) when is_binary(identifier) do
    identifier
    |> URI.decode()
    |> String.split(@identifier_joiner)
  end

  def get_identifier_joiner(), do: @identifier_joiner

  defp identifier_to_path(identifier) do
    [project, uuid] = split_identifier(identifier)

    FieldPublication.FileService.get_web_images_path(project, uuid)
  end

  def get_image_cache_path(%Plug.Conn{
        path_info: [identifier, region, scaling, rotation, quality_and_format]
      }) do
    [project_identifier, uuid] = split_identifier(identifier)

    [
      project_identifier,
      uuid,
      region,
      scaling,
      rotation,
      quality_and_format
    ]
    |> Path.join()
    |> FileService.get_iiif_cache_path()
  end
end
