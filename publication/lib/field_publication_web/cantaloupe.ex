defmodule FieldPublicationWeb.Cantaloupe do
  def url() do
    "#{Application.get_env(:field_publication, :cantaloupe_url)}/iiif"
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

  @doc """
  FieldPublication serves the IIIF image API through a reverse proxy. If users of that API ask for
  the meta JSON about an image, the JSON will contain an "id" key with a link to the image data. That
  link is then used by IIIF compatible viewers to retrieve the appropriate image data.

  In order to get Cantaloupe to return a link matching the FieldPublication's domain and port instead of
  its own domain and port, we have to set the appropriate headers before asking for the meta JSON.

  See also the [Cantaloupe docs](https://cantaloupe-project.github.io/manual/5.0/deployment.html#Reverse-Proxying).
  """
  def set_forward_headers_for_cantaloupe(conn, _options) do
    FieldPublicationWeb.Endpoint.config(:url)
    |> Keyword.get(:port)
    |> case do
      nil ->
        # Development case, has no :url endpoint configuration and thus also no prot definition.
        Plug.Conn.put_req_header(conn, "x-forwarded-port", "4001")

      _ ->
        # Release case
        conn
    end
    |> Plug.Conn.put_req_header("x-forwarded-path", "/api/image/")
  end
end
