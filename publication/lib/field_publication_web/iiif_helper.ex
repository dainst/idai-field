defmodule FieldPublicationWeb.IIIFHelper do
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
end
