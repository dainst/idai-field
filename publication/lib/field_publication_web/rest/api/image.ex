defmodule FieldPublicationWeb.Api.Image do
  use FieldPublicationWeb, :controller

  import Plug.Conn

  alias FieldPublication.FileService

  def raw(conn, %{"project_name" => name, "uuid" => uuid} = _params) do
    base_path = FileService.get_raw_image_data_path(name)

    send_file(conn, 200, "#{base_path}/#{uuid}")
  end

  def tile(
        conn,
        %{"project_name" => name, "uuid" => uuid, "z" => z, "x" => x, "y" => y} = _params
      ) do
    base_path = FileService.get_map_tiles_path(name)

    path = "#{base_path}/#{uuid}/#{z}/#{y}/#{x}.webp"

    if File.exists?(path) do
      cache_type =
        Cachex.exists?(:published_images, {name, uuid})
        |> case do
          {:ok, false} ->
            # Caching in users' browsers only.
            "private"

          _ ->
            "public"
        end

      conn
      |> put_resp_header("cache-control", "#{cache_type}, max-age=31536000, immutable")
      |> put_resp_header("content-type", "image/webp")
      |> send_file(
        200,
        path
      )
    else
      conn
      |> put_resp_header("content-type", "image/png")
      |> send_file(
        404,
        Application.app_dir(:field_publication, "priv/static/images/image_not_found.png")
      )
    end
  end
end
