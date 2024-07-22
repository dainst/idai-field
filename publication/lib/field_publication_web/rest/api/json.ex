defmodule FieldPublicationWeb.Api.JSON do
  use FieldPublicationWeb, :controller

  alias FieldPublication.Publications.Data
  alias FieldPublication.Publications

  def raw(
        conn,
        %{"project_name" => name, "draft_date" => draft_date, "uuid" => uuid} =
          _params
      ) do
    # TODO: Sanitize?
    # TODO: Send 404 if applicable
    # TODO: Check if already published?
    # TODO: Implement more efficient and elegant way to lookup publication

    publication = Publications.get!(name, draft_date)

    doc = Data.get_extended_document(uuid, publication, true)

    conn
    |> Plug.Conn.put_resp_header("content-type", "application/json")
    |> Plug.Conn.send_resp(200, Jason.encode!(doc))
  end
end
