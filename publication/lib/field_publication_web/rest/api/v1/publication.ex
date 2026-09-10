defmodule FieldPublicationWeb.Api.V1.Publication do
  use FieldPublicationWeb, :controller
  use OpenApiSpex.ControllerSpecs

  import Plug.Conn

  alias OpenApiSpex.Schema

  alias FieldPublication.Publications
  alias FieldPublication.Publications.Data
  alias FieldPublication.DatabaseSchema.Publication

  alias FieldPublication.FileService

  @publication_not_found_message "Publication not found."

  tags(["Field Publication API 1.0"])

  operation(:index,
    summary: "Index of all documents in the given publication.",
    parameters: [
      project_identifier: [
        in: :path,
        description: "The project's identifier",
        type: :string,
        example: nil
      ],
      draft_date: [
        in: :path,
        description: "A publication's draft date linked to the specified project",
        type: :string,
        example: nil
      ]
    ],
    responses: [
      ok: {
        "The list of documents in the pubication",
        "application/json",
        nil
      }
    ]
  )

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

  operation(:raw_doc,
    summary: "The raw JSON data for a single publication document.",
    description:
      "Projects setup their own configuration concerning which categories are available in the project, which inputs are available for each category, how
      they are grouped together etc.. Projects can also provide their own translations for UI labels or predefined values for things like dropdown lists. These
      configuration details is kept separate from the document data saved in the project's CouchDB.
      This endpoint retrieves the raw data without the applied project configuration.
      See also the `extended` document API endpoint.",
    parameters: [
      project_identifier: [
        in: :path,
        description: "The project's identifier",
        type: :string,
        example: nil
      ],
      draft_date: [
        in: :path,
        description: "A publication's draft date linked to the specified project",
        type: :string,
        example: nil
      ]
    ],
    responses: [
      ok: {
        "The raw document",
        "application/json",
        nil
      }
    ]
  )

  def raw_doc(
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

  operation(:extended_doc,
    summary: "The extended JSON data for a single publication document.",
    description:
      "Projects setup their own configuration concerning which categories are available in the project, which inputs are available for each category, how
      they are grouped together etc.. Projects can also provide their own translations for UI labels or predefined values for things like dropdown lists. These
      configuration details is kept separate from the document data saved in the project's CouchDB.
      This endpoint retrieves the combined data of raw document plus project configuration, roughly mirroring what you can see in the service's web UI.
      See also the `raw` document API endpoint.",
    parameters: [
      project_identifier: [
        in: :path,
        description: "The project's identifier",
        type: :string,
        example: nil
      ],
      draft_date: [
        in: :path,
        description: "A publication's draft date linked to the specified project",
        type: :string,
        example: nil
      ]
    ],
    responses: [
      ok: {
        "The extended document",
        "application/json",
        nil
      }
    ]
  )

  def extended_doc(
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

  operation(:geo_collections,
    summary: "GeoJSON feature collections for a given publication.",
    parameters: [
      project_identifier: [
        in: :path,
        description: "The project's identifier",
        type: :string,
        example: nil
      ],
      draft_date: [
        in: :path,
        description: "A publication's draft date linked to the specified project",
        type: :string,
        example: nil
      ]
    ],
    responses: [
      ok: {
        "Project and publication list",
        "application/geo+json",
        %Schema{
          type: :array,
          items: %OpenApiSpex.Reference{
            "$ref": "https://geojson.org/schema/FeatureCollection.json"
          }
        }
      }
    ]
  )

  def geo_collections(conn, %{
        "project_identifier" => project_identifier,
        "draft_date" => draft_date
      })
      when is_binary(project_identifier) and is_binary(draft_date) do
    path =
      Publications.get!(project_identifier, draft_date)
      |> FileService.publication_geometry_path(true)

    if File.exists?(path) do
      conn
      |> Plug.Conn.put_resp_header("content-encoding", "br")
      |> Plug.Conn.put_resp_header("content-type", "application/geo+json")
      # TODO: Set public/private based on publication status
      |> Plug.Conn.put_resp_header("cache-control", "private, max-age=86400, immutable")
      |> Plug.Conn.send_file(200, path)
    else
      conn
      |> Plug.Conn.put_resp_header("content-type", "application/json")
      |> Plug.Conn.send_resp(404, JSON.encode!(%{}))
    end
  end

  def list_geo_vector_data(conn, %{
        "project_identifier" => project_identifier,
        "draft_date" => draft_date
      })
      when is_binary(project_identifier) and is_binary(draft_date) do
    case Publications.get(project_identifier, draft_date) do
      {:ok, %Publication{epsg_code: default_code} = publication} ->
        default_code = if default_code, do: default_code, else: "custom-crs"

        conn
        |> put_resp_header("content-type", "application/json")
        |> send_resp(
          200,
          Jason.encode!(%{
            default: default_code,
            available: list_available_epsg_codes(publication)
          })
        )

      _ ->
        conn
        |> put_resp_header("content-type", "text/plain")
        |> send_resp(404, @publication_not_found_message)
    end
  end

  def geo_vector_data(conn, %{
        "project_identifier" => project_identifier,
        "draft_date" => draft_date,
        "epsg" => "default"
      }) do
    case Publications.get(project_identifier, draft_date) do
      {:ok, %Publication{epsg_code: default_code} = publication} ->
        send_geometry(conn, publication, default_code)

      {:error, _} ->
        conn
        |> put_resp_header("content-type", "text/plain")
        |> send_resp(404, @publication_not_found_message)
    end
  end

  def geo_vector_data(conn, %{
        "project_identifier" => project_identifier,
        "draft_date" => draft_date,
        "epsg" => epsg_param
      }) do
    with {:ok, publication} <- Publications.get(project_identifier, draft_date),
         {epsg_code, ""} <- Integer.parse(epsg_param) do
      send_geometry(conn, publication, epsg_code)
    else
      {:error, _} ->
        conn
        |> put_resp_header("content-type", "text/plain")
        |> send_resp(404, @publication_not_found_message)

      _ ->
        conn
        |> put_resp_header("content-type", "text/plain")
        |> send_resp(400, "Invalid ESPG code, expecting integer value.")
    end
  end

  defp send_geometry(conn, %Publication{} = publication, epsg_code) do
    encodings =
      get_req_header(conn, "accept-encoding")
      |> Enum.map(&String.split(&1, ","))
      |> List.flatten()
      |> Enum.map(&String.trim/1)

    {conn, preferred_compression} =
      cond do
        "br" in encodings ->
          {
            put_resp_header(conn, "content-encoding", "br"),
            :br
          }

        "gzip" in encodings ->
          {
            put_resp_header(conn, "content-encoding", "gzip"),
            :gzip
          }

        true ->
          {
            conn,
            :none
          }
      end

    case FileService.geo_vector_data_path(publication, epsg_code, preferred_compression) do
      {:ok, path} ->
        conn
        |> put_resp_header("content-type", "application/geo+json")
        |> send_file(200, path)

      _ ->
        conn
        |> put_resp_header("content-type", "text/plain")
        |> send_resp(404, "Feature collection for EPSG code #{epsg_code} not found.")
    end
  end

  @epsg_code_regex ~r/vector_geometries_EPSG-(\d+)\.geojson/
  defp list_available_epsg_codes(%Publication{} = publication) do
    FileService.geo_data_path(publication)
    |> File.ls!()
    |> Stream.filter(fn file_name -> String.ends_with?(file_name, ".geojson") end)
    |> Stream.map(fn file_name ->
      Regex.run(@epsg_code_regex, file_name)
      |> case do
        [_, code_string] ->
          {code, ""} = Integer.parse(code_string)
          code

        _ ->
          nil
      end
    end)
    |> Enum.reject(fn val -> is_nil(val) end)
  end
end
