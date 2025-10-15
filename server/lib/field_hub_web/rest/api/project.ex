defmodule FieldHubWeb.Rest.Api.Rest.Project do
  use FieldHubWeb, :controller

  alias FieldHub.CouchService

  alias FieldHub.{
    Project,
    User
  }

  @identifier_length Application.compile_env(:field_hub, :max_project_identifier_length)

  @moduledoc """
  This API controller module handles the HTTP requests for listing, creating or deleting projects.
  """

  def index(%{assigns: %{current_user: user_name}} = conn, _params) do
    send_resp(
      conn,
      200,
      user_name |> Project.get_all_for_user() |> Jason.encode!()
    )
  end

  def show(conn, %{"project" => id}) do
    send_resp(
      conn,
      200,
      id |> Project.evaluate_project() |> Jason.encode!()
    )
  end

  def create(conn, %{"project" => id}) do
    password =
      with {:ok, body, _conn} <- read_body(conn),
           {:ok, %{"password" => password}} <- JSON.decode(body) do
        password
      else
        _ ->
          CouchService.create_password()
      end

    cond do
      Project.exists?(id) ->
        send_resp(conn, 412, Jason.encode!(%{reason: "Project #{id} already exists."}))

      User.exists?(id) ->
        send_resp(
          conn,
          412,
          Jason.encode!(%{reason: "Default project user #{id} already exists."})
        )

      true ->
        project_creation = Project.create(id)

        case project_creation do
          :invalid_name ->
            send_resp(
              conn,
              400,
              Jason.encode!(%{
                reason:
                  "Invalid project name: Identifier can have #{@identifier_length} characters maximum and requires valid name, regex: /^[a-z][a-z0-9_$()+/-]*$/"
              })
            )

          _ ->
            user_creation = User.create(id, password)
            role_creation = Project.update_user(id, id, :member)

            response_payload = %{
              status_project: project_creation,
              status_user: user_creation,
              status_role: role_creation,
              password: password
            }

            send_resp(
              conn,
              201,
              Jason.encode!(%{info: response_payload})
            )
        end
    end
  end

  def delete(conn, %{"project" => id}) do
    project_deletion_result = Project.delete(id)
    user_deletion_result = User.delete(id)

    response_payload = %{
      status_project: project_deletion_result,
      status_user: user_deletion_result
    }

    send_resp(
      conn,
      200,
      Jason.encode!(%{info: response_payload})
    )
  end
end
