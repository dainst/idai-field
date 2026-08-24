defmodule FieldPublicationWeb.Api.V1 do
  use FieldPublicationWeb, :controller
  use OpenApiSpex.ControllerSpecs

  alias FieldPublication.Projects
  alias FieldPublication.Publications
  alias FieldPublication.DatabaseSchema.Publication

  alias FieldPublication.FileService
  alias OpenApiSpex.Schema

  tags(["Field Publication API 1.0"])

  operation(:publications,
    summary: "List all projects and publications visible to the user.",
    responses: [
      ok: {
        "Project and publication list",
        "application/json",
        %Schema{
          type: :array,
          items: %Schema{
            title: "Project Info",
            description: "Basic information concerning a single project and its publications.",
            type: :object,
            properties: %{
              project_identifier: %Schema{type: :string},
              publications: %Schema{
                type: :array,
                items: %Schema{
                  type: :string
                }
              }
            },
            required: [
              :project_identifier,
              :publications
            ],
            example: %{
              project_identifier: "bourgou",
              publications: [
                "2026-04-17"
              ]
            }
          }
        }
      }
    ]
  )

  def publications(%{assigns: %{current_user: user}} = conn, _params) do
    project_list =
      Publications.list()
      |> Stream.filter(fn %Publication{
                            project_identifier: project_identifier,
                            publication_date: publication_date
                          } ->
        publication_date != nil ||
          Projects.has_project_access?(project_identifier, user)
      end)
      |> Enum.reduce(%{}, fn %Publication{
                               project_identifier: project_identifier
                             } = publication,
                             acc ->
        Map.update(acc, project_identifier, [publication], fn other_publications ->
          other_publications ++ [publication]
        end)
      end)
      |> Enum.map(fn {project_identifier, publication_list} ->
        %{
          project_identifier: project_identifier,
          publications:
            Enum.map(
              publication_list,
              fn %Publication{draft_date: draft_date} -> draft_date end
            )
        }
      end)

    conn
    |> Plug.Conn.put_resp_header("content-type", "application/json")
    |> Plug.Conn.send_resp(200, Jason.encode!(project_list))
  end

  operation(:geometry_feature_collections,
    summary: "GeoJSON feature collections for a given publication.",
    parameters: [
      project_identifier: [
        in: :path,
        description: "A project's id",
        type: :string,
        example: "bourgou"
      ],
      draft_date: [
        in: :path,
        description: "A publication's draft date linked to the specified project",
        type: :string,
        example: "TODO"
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

  def geometry_feature_collections(conn, %{
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
end
