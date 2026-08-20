defmodule FieldPublicationWeb.Api.V1 do
  use FieldPublicationWeb, :controller

  alias FieldPublication.Projects
  alias FieldPublication.Publications
  alias FieldPublication.DatabaseSchema.Publication

  alias FieldPublication.FileService

  def projects(%{assigns: %{current_user: user}} = conn, _params) do
    project_list =
      Publications.list()
      |> Enum.filter(fn %Publication{
                          project_identifier: project_identifier,
                          publication_date: publication_date
                        } ->
        publication_date != nil ||
          Projects.has_project_access?(project_identifier, user)
      end)
      |> Enum.map(fn %Publication{project_identifier: project_identifier} ->
        project_identifier
      end)

    conn
    |> Plug.Conn.put_resp_header("content-type", "application/json")
    |> Plug.Conn.send_resp(200, Jason.encode!(project_list))
  end

  def publications(%{assigns: %{current_user: user}} = conn, %{
        "project_identifier" => project_identifier
      }) do
    publication_list =
      Publications.list(project_identifier)
      |> Enum.filter(fn %Publication{
                          project_identifier: project_identifier,
                          publication_date: publication_date
                        } ->
        publication_date != nil ||
          Projects.has_project_access?(project_identifier, user)
      end)
      |> Enum.map(fn %Publication{draft_date: draft_date} ->
        draft_date
      end)

    conn
    |> Plug.Conn.put_resp_header("content-type", "application/json")
    |> Plug.Conn.send_resp(200, Jason.encode!(publication_list))
  end

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
      |> Plug.Conn.put_resp_header("content-type", "application/json")
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
