defmodule FieldPublicationWeb.Api.V1.Project do
  use FieldPublicationWeb, :controller
  use OpenApiSpex.ControllerSpecs

  import Plug.Conn

  alias FieldPublication.FileService

  tags(["Field Publication API 1.0"])
  security [%{}, %{"basic_auth" => []}]

  operation(:raw_image,
    summary: "Retrieve the raw image data for a specific image document.",
    parameters: [
      project_identifier: [
        in: :path,
        description: "The project's id",
        type: :string,
        example: nil
      ],
      uuid: [
        in: :path,
        description: "The image's document UUID.",
        type: :string,
        example: nil
      ]
    ],
    responses: %{
      200 => {
        "Image data",
        "image/*",
        nil
      },
      401 => {
        "Not authorized",
        "application/text",
        nil
      },
      403 => {
        "Forbidden",
        "application/text",
        nil
      }
    }
  )

  def raw_image(conn, %{"project_identifier" => project_identifier, "uuid" => uuid} = _params) do
    path = FileService.get_raw_image_data_path(project_identifier, uuid)

    conn
    |> put_resp_header("content-type", "image/*")
    |> send_file(200, path)
  end

  operation(:zxy_tile,
    summary: "Retrieve ZXY map tiles for a specific image document.",
    description:
      "If an image document is geo-referenced, the system will generate a ZXY tiles of the associated image which
      can be displayed as background layers on a project map.",
    parameters: [
      project_identifier: [
        in: :path,
        description: "The project's identifier.",
        type: :string,
        example: nil
      ],
      uuid: [
        in: :path,
        description: "The image's document UUID.",
        type: :string,
        example: nil
      ],
      z: [
        in: :path,
        type: :integer
      ],
      x: [
        in: :path,
        type: :integer
      ],
      y: [
        in: :path,
        type: :integer
      ]
    ],
    responses: %{
      200 => {
        "Image data",
        "image/*",
        nil
      },
      401 => {
        "Not authorized",
        "application/text",
        nil
      },
      403 => {
        "Forbidden",
        "application/text",
        nil
      }
    }
  )

  def zxy_tile(
        conn,
        %{
          "project_identifier" => project_identifier,
          "uuid" => uuid,
          "z" => z,
          "x" => x,
          "y" => y
        } = _params
      ) do
    base_path = FileService.get_map_tiles_base_path(project_identifier, uuid)

    # Even though we serve the tiles with the z/x/y schema in the API, libvips generated
    # the tiles in a z/y/x directory structure, which we translate here:
    path = "#{base_path}/#{z}/#{y}/#{x}.webp"

    if File.exists?(path) do
      cache_type =
        Cachex.exists?(:published_images, {project_identifier, uuid})
        |> case do
          {:ok, false} ->
            # Caching in users' browsers only.
            "private"

          _ ->
            "public"
        end

      conn
      |> put_resp_header("cache-control", "#{cache_type}, max-age=86400, immutable")
      |> put_resp_header("content-type", "image/webp")
      |> send_file(
        200,
        path
      )
    else
      conn
      |> put_resp_header("content-type", "image/png")
      |> send_file(
        404,
        Application.app_dir(:field_publication, "priv/static/images/image_not_found.png")
      )
    end
  end
end
