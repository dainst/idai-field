defmodule IdaiFieldServerWeb.ProjectSessionController do
  use IdaiFieldServerWeb, :controller

  alias IdaiFieldServer.Accounts
  alias IdaiFieldServerWeb.ProjectAuth

  def new(conn, _params) do
    render(conn, "new.html", error_message: nil)
  end

  def create(conn, %{"project" => project_params}) do
    %{"email" => email, "password" => password} = project_params

    if project = Accounts.get_project_by_email_and_password(email, password) do
      ProjectAuth.log_in_project(conn, project, project_params)
    else
      render(conn, "new.html", error_message: "Invalid e-mail or password")
    end
  end

  def delete(conn, _params) do
    conn
    |> put_flash(:info, "Logged out successfully.")
    |> ProjectAuth.log_out_project()
  end
end
