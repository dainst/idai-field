defmodule FieldHubWeb.Api.ProjectController do
  use FieldHubWeb, :controller

  alias FieldHub.CouchService

  alias FieldHub.{
    Project,
    User
  }

  alias FieldHubWeb.Api.StatusView

  def index(%{assigns: %{current_user: user_name}} = conn, _params) do
    render(conn, "list.json", %{projects: Project.get_all_for_user(user_name)})
  end

  def show(conn, %{"project" => project_name}) do
    render(conn, "show.json", %{project: Project.evaluate_project(project_name)})
  end

  def create(conn, %{"project" => project_name}) do
    password =
      conn.body_params
      |> case do
        %{"password" => requested_password} ->
          requested_password

        _ ->
          :generate
      end
      |> case do
        :generate ->
          CouchService.create_password()

        provided ->
          provided
      end

    project_creation = Project.create(project_name)

    case project_creation do
      :invalid_name ->
        conn
        |> put_status(:bad_request)
        |> put_view(StatusView)
        |> render(%{error: "Invalid project name. Valid name regex: /^[a-z][a-z0-9_$()+/-]*$/"})
      other ->
        user_creation = User.create(project_name, password)
        role_creation = Project.update_user(project_name, project_name, :member)

        response_payload = %{
          status_project: other,
          status_user: user_creation,
          status_role: role_creation
        }

        response_payload =
          if user_creation == :created do
            Map.put(response_payload, :password, password)
          else
            response_payload
          end

        conn
        |> put_view(StatusView)
        |> render(%{info: response_payload})
    end
  end

  def delete(conn, %{"project" => project_name}) do
    project = Project.delete(project_name)
    user = User.delete(project_name)

    response_payload = %{
      status_project: project,
      status_user: user
    }

    conn
    |> put_view(StatusView)
    |> render(%{info: response_payload})
  end
end
