defmodule IdaiFieldServerWeb.ProjectResetPasswordController do
  use IdaiFieldServerWeb, :controller

  alias IdaiFieldServer.Accounts

  plug :get_project_by_reset_password_token when action in [:edit, :update]

  def new(conn, _params) do
    render(conn, "new.html")
  end

  def create(conn, %{"project" => %{"email" => email}}) do
    if project = Accounts.get_project_by_email(email) do
      Accounts.deliver_project_reset_password_instructions(
        project,
        &Routes.project_reset_password_url(conn, :edit, &1)
      )
    end

    # Regardless of the outcome, show an impartial success/error message.
    conn
    |> put_flash(
      :info,
      "If your e-mail is in our system, you will receive instructions to reset your password shortly."
    )
    |> redirect(to: "/")
  end

  def edit(conn, _params) do
    render(conn, "edit.html", changeset: Accounts.change_project_password(conn.assigns.project))
  end

  # Do not log in the project after reset password to avoid a
  # leaked token giving the project access to the account.
  def update(conn, %{"project" => project_params}) do
    case Accounts.reset_project_password(conn.assigns.project, project_params) do
      {:ok, _} ->
        conn
        |> put_flash(:info, "Password reset successfully.")
        |> redirect(to: Routes.project_session_path(conn, :new))

      {:error, changeset} ->
        render(conn, "edit.html", changeset: changeset)
    end
  end

  defp get_project_by_reset_password_token(conn, _opts) do
    %{"token" => token} = conn.params

    if project = Accounts.get_project_by_reset_password_token(token) do
      conn |> assign(:project, project) |> assign(:token, token)
    else
      conn
      |> put_flash(:error, "Reset password link is invalid or it has expired.")
      |> redirect(to: "/")
      |> halt()
    end
  end
end
