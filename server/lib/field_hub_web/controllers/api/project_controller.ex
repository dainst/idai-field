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

  def show(conn, %{"project" => id}) do
    project_info = Project.evaluate_project(id)

    render(conn, "show.json", %{project: project_info})
  end

  def create(conn, %{"project" => id}) do
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

    cond do
      Project.exists?(id) ->
        conn
        |> put_status(:precondition_failed)
        |> put_view(StatusView)
        |> render(%{error: "Project #{id} already exists."})

      User.exists?(id) ->
        conn
        |> put_status(:precondition_failed)
        |> put_view(StatusView)
        |> render(%{error: "Default project user #{id} already exists."})

      true ->
        project_creation = Project.create(id)

        case project_creation do
          :invalid_name ->
            conn
            |> put_status(:bad_request)
            |> put_view(StatusView)
            |> render(%{
              error: "Invalid project name. Valid name regex: /^[a-z][a-z0-9_$()+/-]*$/"
            })

          _ ->
            user_creation = User.create(id, password)
            role_creation = Project.update_user(id, id, :member)

            response_payload = %{
              status_project: project_creation,
              status_user: user_creation,
              status_role: role_creation,
              password: password
            }

            conn
            |> put_status(:created)
            |> put_view(StatusView)
            |> render(%{info: response_payload})
        end
    end
  end

  def delete(conn, %{"project" => id}) do
    project = Project.delete(id)
    user = User.delete(id)

    response_payload = %{
      status_project: project,
      status_user: user
    }

    conn
    |> put_view(StatusView)
    |> render(%{info: response_payload})
  end
end
