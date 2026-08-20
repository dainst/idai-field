defmodule FieldPublicationWeb.Api.V1.Document do
  use FieldPublicationWeb, :controller

  import Plug.Conn

  alias FieldPublication.Publications
  alias FieldPublication.Publications.Data
  alias FieldPublication.DatabaseSchema.Publication

  def index(
        conn,
        %{"project_identifier" => project_identifier, "draft_date" => draft_date} = _param
      ) do
    Publications.get(project_identifier, draft_date)
    |> case do
      {:ok, %Publication{} = publication} ->
        image_categories = Publications.Data.get_image_categories(publication)

        list =
          Data.get_doc_stream_for_all(publication)
          |> Stream.map(fn %{
                             "resource" =>
                               %{
                                 "id" => id,
                                 "identifier" => identifier,
                                 "category" => category
                               } = resource
                           } ->
            %{
              "id" => id,
              "identifier" => identifier,
              "category" => category,
              "shortDescription" => Map.get(resource, "shortDescription"),
              "hasImageData?" => category in image_categories,
              "hasGeoReference?" =>
                Map.has_key?(resource, "georeference") && resource["georeference"] != nil
            }
          end)
          |> Enum.to_list()

        conn
        |> Plug.Conn.put_resp_header("content-type", "application/json")
        |> Plug.Conn.send_resp(200, Jason.encode!(list))

      _ ->
        conn
        |> Plug.Conn.put_resp_header("content-type", "application/json")
        |> Plug.Conn.send_resp(404, Jason.encode!(%{reason: "Unknown publication"}))
    end
  end

  def raw(
        conn,
        %{"project_identifier" => project_identifier, "draft_date" => draft_date, "uuid" => uuid} =
          _params
      ) do
    publication = Publications.get!(project_identifier, draft_date)

    doc = Data.get_raw_document(uuid, publication)

    conn
    |> Plug.Conn.put_resp_header("content-type", "application/json")
    |> Plug.Conn.send_resp(200, Jason.encode!(doc))
  end

  def extended(
        conn,
        %{"project_identifier" => project_identifier, "draft_date" => draft_date, "uuid" => uuid} =
          _params
      ) do
    publication = Publications.get!(project_identifier, draft_date)

    doc = Data.get_extended_document(uuid, publication, true)

    conn
    |> Plug.Conn.put_resp_header("content-type", "application/json")
    |> Plug.Conn.send_resp(200, Jason.encode!(doc))
  end
end
