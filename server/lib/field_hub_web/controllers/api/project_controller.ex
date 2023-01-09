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
    {password, additional_users} =
      conn.body_params
      |> case do
        %{"additional_users" => additional_users, "password" => requested_password} ->
          {requested_password, parse_additional_users(additional_users)}

        %{"additional_users" => additional_users} ->
          {:generate, parse_additional_users(additional_users)}

        %{"password" => requested_password} ->
          {requested_password, []}

        _ ->
          {:generate, []}
      end
      |> case do
        {:generate, parsed_users} ->
          {CouchService.create_password(), parsed_users}

        other ->
          other
      end

    case additional_users do
      {:invalid_payload, error} ->
        conn
        |> put_status(:bad_request)
        |> put_view(StatusView)
        |> render(%{error: %{payload: error}})

      additional_users ->
        project_creation = Project.create(project_name)

        case project_creation do
          :invalid_name ->
            conn
            |> put_status(:bad_request)
            |> put_view(StatusView)
            |> render(%{
              error: "Invalid project name. Valid name regex: /^[a-z][a-z0-9_$()+/-]*$/"
            })

          other ->
            user_creation = User.create(project_name, password)
            role_creation = Project.update_user(project_name, project_name, :member)

            additional_users_creation =
              additional_users
              |> Enum.map(fn {name, pw} ->
                {pw, User.create(name, pw), Project.update_user(name, project_name, :member)}
              end)
              |> Enum.map(fn {pw, u_creation, r_creation} ->
                case u_creation do
                  :created ->
                    %{status_user: u_creation, status_role: r_creation, password: pw}

                  _ ->
                    %{status_user: u_creation, status_role: r_creation}
                end
              end)

            response_payload = %{
              status_project: other,
              status_user: user_creation,
              status_role: role_creation,
              status_additional_users: additional_users_creation
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

  defp parse_additional_users(request) when is_list(request) do
    parsed_items =
      request
      |> Enum.map(fn user ->
        case user do
          %{"name" => name, "password" => password} ->
            {name, password}

          %{"name" => name} ->
            {name, :generate}

          _ ->
            {:invalid_payload, user}
        end
      end)

    errors =
      Enum.filter(parsed_items, fn parsed_user ->
        case parsed_user do
          {:invalid_payload, _user} ->
            true

          _ ->
            false
        end
      end)

    case errors do
      [] ->
        parsed_items

      errors ->
        {:invalid_payload, errors}
    end
  end

  defp parse_additional_users(request) do
    {:invalid_payload, request}
  end
end
