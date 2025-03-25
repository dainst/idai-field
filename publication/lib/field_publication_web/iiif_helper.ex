defmodule FieldPublicationWeb.IIIFHelper do
  def identifier_to_path(identifier) do
    [project, uuid] =
      URI.decode(identifier)
      |> String.split("/")

    "#{FieldPublication.FileService.get_raw_image_data_path(project)}/#{uuid}"
  end

  def handle_404(conn, plug_info) do
    response_body =
      if Plug.Conn.request_url(conn) |> String.ends_with?(".json") do
        plug_info
      else
        File.read!(
          Application.app_dir(:field_publication, "priv/static/images/image_not_found.png")
        )
      end

    Plug.Conn.resp(
      conn,
      404,
      Jason.encode!(response_body)
    )
  end
end
