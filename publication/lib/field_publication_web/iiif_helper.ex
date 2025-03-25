defmodule FieldPublicationWeb.IIIFHelper do
  def identifier_to_path(identifier) do
    [project, uuid] =
      URI.decode(identifier)
      |> String.split("/")

    "#{FieldPublication.FileService.get_raw_image_data_path(project)}/#{uuid}"
  end

  def handle_404(conn, _plug_info) do
    response_body =
      cond do
        Plug.Conn.request_url(conn)
        |> String.ends_with?(".json") ->
          Jason.encode!(%{"error" => "Unknown image information requested."})

        true ->
          # As default we assume an image was requested and we return the fallback png.
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
