defmodule FieldPublicationWeb.Api.JSON do
  use FieldPublicationWeb, :controller

  alias FieldPublication.Publications
  alias FieldPublication.Publications.Data

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

  def geometry_feature_collections(conn, %{
        "project_key" => project_key,
        "draft_date" => draft_date
      }) do
    publication = Publications.get!(project_key, draft_date)

    feature_collections = Data.get_project_geometry_feature_collections(publication)

    conn
    |> Plug.Conn.put_resp_header("content-type", "application/json")
    |> Plug.Conn.send_resp(200, Jason.encode!(feature_collections))
  end
end
