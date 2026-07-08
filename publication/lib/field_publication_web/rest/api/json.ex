defmodule FieldPublicationWeb.Api.JSON do
  use FieldPublicationWeb, :controller

  alias FieldPublication.Publications
  alias FieldPublication.Publications.Data
  alias FieldPublication.FileService

  def raw(
        conn,
        %{"project_id" => name, "draft_date" => draft_date, "uuid" => uuid} =
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
        %{"project_id" => name, "draft_date" => draft_date, "uuid" => uuid} =
          _params
      ) do
    publication = Publications.get!(name, draft_date)

    doc = Data.get_extended_document(uuid, publication, true)

    conn
    |> Plug.Conn.put_resp_header("content-type", "application/json")
    |> Plug.Conn.send_resp(200, Jason.encode!(doc))
  end

  def geometry_feature_collections(conn, %{
        "project_id" => project_key,
        "draft_date" => draft_date
      })
      when is_binary(project_key) and is_binary(draft_date) do
    path =
      Publications.get!(project_key, draft_date)
      |> FileService.publication_geometry_path(true)

    if File.exists?(path) do
      conn
      |> Plug.Conn.put_resp_header("content-encoding", "br")
      |> Plug.Conn.put_resp_header("content-type", "application/json")
      |> Plug.Conn.send_file(200, path)
    else
      conn
      |> Plug.Conn.put_resp_header("content-type", "application/json")
      |> Plug.Conn.send_resp(404, JSON.encode!(%{}))
    end
  end
end
