defmodule IdaiFieldServerWeb.ProjectRegistrationController do
  use IdaiFieldServerWeb, :controller

  alias IdaiFieldServer.Accounts
  alias IdaiFieldServer.Accounts.Project
  alias IdaiFieldServerWeb.ProjectAuth

  def new(conn, _params) do
    changeset = Accounts.change_project_registration(%Project{})
    render(conn, "new.html", changeset: changeset)
  end

  def create(conn, %{"project" => project_params}) do
    case Accounts.register_project(project_params) do
      {:ok, project} ->
        {:ok, _} =
          Accounts.deliver_project_confirmation_instructions(
            project,
            &Routes.project_confirmation_url(conn, :confirm, &1)
          )

        conn
        |> put_flash(:info, "Project created successfully.")
        |> ProjectAuth.log_in_project(project)

      {:error, %Ecto.Changeset{} = changeset} ->
        render(conn, "new.html", changeset: changeset)
    end
  end
end
