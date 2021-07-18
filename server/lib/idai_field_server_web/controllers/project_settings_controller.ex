defmodule IdaiFieldServerWeb.ProjectSettingsController do
  use IdaiFieldServerWeb, :controller

  alias IdaiFieldServer.Accounts
  alias IdaiFieldServerWeb.ProjectAuth

  plug :assign_email_and_password_changesets

  def edit(conn, _params) do
    render(conn, "edit.html")
  end

  def update_email(conn, %{"current_password" => password, "project" => project_params}) do
    project = conn.assigns.current_project

    case Accounts.apply_project_email(project, password, project_params) do
      {:ok, applied_project} ->
        Accounts.deliver_update_email_instructions(
          applied_project,
          project.email,
          &Routes.project_settings_url(conn, :confirm_email, &1)
        )

        conn
        |> put_flash(
          :info,
          "A link to confirm your e-mail change has been sent to the new address."
        )
        |> redirect(to: Routes.project_settings_path(conn, :edit))

      {:error, changeset} ->
        render(conn, "edit.html", email_changeset: changeset)
    end
  end

  def confirm_email(conn, %{"token" => token}) do
    case Accounts.update_project_email(conn.assigns.current_project, token) do
      :ok ->
        conn
        |> put_flash(:info, "E-mail changed successfully.")
        |> redirect(to: Routes.project_settings_path(conn, :edit))

      :error ->
        conn
        |> put_flash(:error, "Email change link is invalid or it has expired.")
        |> redirect(to: Routes.project_settings_path(conn, :edit))
    end
  end

  def update_password(conn, %{"current_password" => password, "project" => project_params}) do
    project = conn.assigns.current_project

    case Accounts.update_project_password(project, password, project_params) do
      {:ok, project} ->
        conn
        |> put_flash(:info, "Password updated successfully.")
        |> put_session(:project_return_to, Routes.project_settings_path(conn, :edit))
        |> ProjectAuth.log_in_project(project)

      {:error, changeset} ->
        render(conn, "edit.html", password_changeset: changeset)
    end
  end

  defp assign_email_and_password_changesets(conn, _opts) do
    project = conn.assigns.current_project

    conn
    |> assign(:email_changeset, Accounts.change_project_email(project))
    |> assign(:password_changeset, Accounts.change_project_password(project))
  end
end
