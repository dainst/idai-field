defmodule FieldPublicationWeb.Api do
  use FieldPublicationWeb, :controller

  alias OpenApiSpex.{Info, OpenApi, Paths, Server}
  alias FieldPublicationWeb.{Endpoint, Router}
  @behaviour OpenApi

  alias FieldPublication.Settings

  @impl OpenApi
  def spec do
    iiif_specs = %{
      "/api/iiif/image/v3/{identifier}/info.json" => %{
        "$ref" => "./iiif/image/v3/spec/info"
      },
      "/api/iiif/image/v3/{identifier}/{region}/{size}/{rotation}/{quality}{format}" => %{
        "$ref" => "./iiif/image/v3/spec/data"
      }
    }

    %OpenApi{
      servers: [
        # Populate the Server info from a phoenix endpoint
        Server.from_endpoint(Endpoint)
      ],
      info: %Info{
        title: "API Documentation · #{Settings.get_page_name()}",
        description:
          "Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet. Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet.",
        version: to_string(Application.spec(:my_app, :vsn))
      },
      # Populate the paths from a phoenix router
      paths: Paths.from_router(Router)
    }
    # Discover request/response schemas from path specs
    |> OpenApiSpex.resolve_schema_modules()
    |> OpenApiSpex.OpenApi.to_map()
    |> Map.update!("paths", fn derived_from_router ->
      # Add additional schemas defined below, whose routes are not directly part of the application.
      Map.merge(derived_from_router, iiif_specs)
      |> Map.delete("/api/v1/spec")
    end)
    |> OpenApiSpex.OpenApi.from_map()
  end

  def iiif_v3_info_spec(conn, _params) do
    spec = %{
      get: %{
        tags: ["IIIF Image API 3.0"],
        summary: "IIIF Image API 3.0 information request",
        description:
          "This endpoint allows users retrieve __image metadata__ according to the IIIF image
          API Version 3, compliance level 2. For more detailed information about what different
          parameters are available, have a look at the linked official documentation.",
        operationId: "FieldPublicationWeb.Api.IIIFImage info",
        externalDocs: %{
          description: "Official API specification",
          url: "https://iiif.io/api/image/3.0/"
        },
        parameters: [
          %{
            name: "identifier",
            in: "path",
            required: true,
            type: "string",
            description:
              "The identifier used in IIIF requests is a combination of project identifier and
              the image's ID in the form `<project identifier>|<uuid>`.",
            example: ["bourgou/1e8b4d62-260c-4a0c-9ded-914f97299e4e"]
          }
        ],
        responses: %{
          "200": %{
            content: %{
              "application/json": %{}
            }
          }
        }
      }
    }

    conn
    |> Plug.Conn.put_resp_header("content-type", "application/json")
    |> Plug.Conn.send_resp(200, JSON.encode!(spec))
  end

  def iiif_v3_data_spec(conn, _params) do
    spec = %{
      get: %{
        summary: "IIIF Image API 3.0 data request",
        tags: ["IIIF Image API 3.0"],
        description: "This endpoint allows users retrieve __image data__ according the IIIF image
        API Version 3, compliance level 2. For more detailed information about what different
        parameters are available, have a look at the linked official documentation.",
        operationId: "iiif_v3_data",
        externalDocs: %{
          description: "Official API specification",
          url: "https://iiif.io/api/image/3.0/"
        },
        parameters: [
          %{
            name: "identifier",
            in: "path",
            required: true,
            type: "string",
            description:
              "The identifier used in IIIF requests is a combination of project identifier and the image ID in the form `<project identifier>|<uuid>`.",
            example: "bourgou/1e8b4d62-260c-4a0c-9ded-914f97299e4e"
          },
          %{
            name: "region",
            in: "path",
            example: "full",
            required: true
          },
          %{
            name: "size",
            in: "path",
            example: "!250,250",
            required: true
          },
          %{
            name: "rotation",
            in: "path",
            example: "45",
            required: true
          },
          %{
            name: "quality",
            in: "path",
            example: "gray",
            required: true
          },
          %{
            name: "format",
            in: "path",
            example: ".jpg",
            required: true
          }
        ],
        responses: %{
          "200": %{
            content: %{
              # TODO: Phoenix does not accept image/* in the api pipeline, why?
              "*/*": %{
                type: :string,
                format: :binary
              }
            }
          }
        }
      }
    }

    conn
    |> Plug.Conn.put_resp_header("content-type", "application/json")
    |> Plug.Conn.send_resp(200, JSON.encode!(spec))
  end
end
