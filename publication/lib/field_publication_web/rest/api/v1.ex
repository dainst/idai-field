defmodule FieldPublicationWeb.Api.V1 do
  use FieldPublicationWeb, :controller
  use OpenApiSpex.ControllerSpecs

  alias FieldPublication.Projects
  alias FieldPublication.Publications
  alias FieldPublication.DatabaseSchema.Publication

  alias OpenApiSpex.Schema

  tags(["Field Publication API 1.0"])

  operation(:index,
    summary: "Index of all projects and publications visible to the user.",
    responses: [
      ok: {
        "Project and publication list",
        "application/json",
        %Schema{
          title: "ProjectList",
          description: "Lists all  projects alongside their publications.",
          type: :array,
          items: %Schema{
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
                "2025-06-17",
                "2026-04-17"
              ]
            }
          }
        }
      }
    ]
  )

  def index(%{assigns: %{current_user: user}} = conn, _params) do
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
end
