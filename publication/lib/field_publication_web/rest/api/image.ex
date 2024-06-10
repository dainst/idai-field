defmodule FieldPublicationWeb.Api.Image do
  alias FieldPublication.FileService
  use FieldPublicationWeb, :controller
  # TODO: Sanitize?
  # TODO: Send 404 if applicable
  def raw(conn, %{"project_name" => name, "uuid" => uuid} = _params) do
    base_path = FileService.get_raw_image_data_path(name)

    Plug.Conn.send_file(conn, 200, "#{base_path}/#{uuid}")
  end

  def tile(
        conn,
        %{"project_name" => name, "uuid" => uuid, "z" => z, "x" => x, "y" => y} = _params
      ) do
    base_path = FileService.get_map_tiles_path(name)

    Plug.Conn.send_file(conn, 200, "#{base_path}/#{uuid}/#{z}/#{x}/#{y}.png")
  end
end
