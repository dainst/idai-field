defmodule FieldPublicationWeb.Api.Image do
  alias FieldPublication.FileService
  use FieldPublicationWeb, :controller

  def show(conn, %{"project_name" => name, "uuid" => uuid} = _params) do
    # TODO: Sanitize?
    # TODO: Send 404 if applicable

    base_path = FileService.get_raw_image_data_path(name)

    Plug.Conn.send_file(conn, 200, "#{base_path}/#{uuid}")
  end
end
