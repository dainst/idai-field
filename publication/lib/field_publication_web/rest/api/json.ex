defmodule FieldPublicationWeb.Api.JSON do
  use FieldPublicationWeb, :controller

  alias FieldPublication.Publications.Data
  alias FieldPublication.Publications

  def raw(
        conn,
        %{"project_name" => name, "draft_date" => draft_date, "uuid" => uuid} =
          _params
      ) do
    publication = Publications.get!(name, draft_date)

    doc = Data.get_raw_document(uuid, publication)

    conn
    |> Plug.Conn.put_resp_header("content-type", "application/json")
    |> Plug.Conn.send_resp(200, Jason.encode!(doc))
  end

  def extended(
        conn,
        %{"project_name" => name, "draft_date" => draft_date, "uuid" => uuid} =
          _params
      ) do
    publication = Publications.get!(name, draft_date)

    doc = Data.get_extended_document(uuid, publication, true)

    conn
    |> Plug.Conn.put_resp_header("content-type", "application/json")
    |> Plug.Conn.send_resp(200, Jason.encode!(doc))
  end
end
