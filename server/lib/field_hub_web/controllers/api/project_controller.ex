defmodule FieldHubWeb.Api.ProjectController do
  use FieldHubWeb, :controller

  alias FieldHub.Project
  alias FieldHubWeb.Api.StatusView

  def index(%{assigns: %{current_user: user_name}} = conn, _params) do
    render(conn, "list.json", %{projects: Project.get_all_for_user(user_name)})
  end

  def show(conn, %{"project" => project_name}) do
    render(conn, "show.json", %{project: Project.evaluate_project(project_name)})
  end

  def create(conn, %{"project" => _project_name}) do
    # STUB/TODO: Refactor CLI module to more general Administration module and provide useful
    # return values, which the CLI module currently lacks.
    conn
    |> put_status(:created)
    |> put_view(StatusView)
    |> render(%{info: "Project created."})

    #   result =
    #     read_body(conn)
    #     |> case do
    #       {:ok, "", _conn} ->
    #         password = CouchService.create_password()

    #         {
    #           password,
    #           FieldHub.CLI.create_project_with_default_user(
    #             project_name,
    #             password
    #           )
    #           |> IO.inspect()
    #         }

    #       {:ok, body, _conn} ->
    #         body
    #         |> Jason.decode()
    #         |> case do
    #           {:ok, %{password: password}} ->
    #             {password, FieldHub.CLI.create_project_with_default_user(project_name, password)}

    #           _ ->
    #             {:invalid_payload, body}
    #         end
    #     end

    #   case result do
    #     {password, %{status_code: 200}} ->
    #       conn
    #       |> put_view(StatusView)
    #       |> render(%{info: %{password: password}})

    #     {:invalid_payload, payload} ->
    #       conn
    #       |> put_status(:bad_request)
    #       |> put_view(StatusView)
    #       |> render(%{error: "Invalid payload #{payload}"})
    #   end
  end
end
