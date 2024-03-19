defmodule FieldPublicationWeb.Cantaloupe do
  def url() do
    Application.get_env(:field_publication, :cantaloupe_url)
  end

  def handle_404(conn, _plug_info) do
    response_body =
      cond do
        Plug.Conn.request_url(conn)
        |> String.ends_with?(".json") ->
          %{}

        true ->
          # As default we assume an image was requested and we return the fallback png.
          File.read!(
            Application.app_dir(:field_publication, "priv/static/images/image_not_found.png")
          )
      end

    Plug.Conn.resp(
      conn,
      :not_found,
      response_body
    )
  end
end
