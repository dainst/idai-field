defmodule FieldHubWeb.Rest.UserSession do
  use FieldHubWeb, :controller

  alias FieldHub.CouchService
  alias FieldHubWeb.UserAuth

  def create(conn, params) do
    create(conn, params, "Welcome back!")
  end

  defp create(conn, %{"user" => user_params}, info) do
    %{"name" => name, "password" => password} = user_params

    if :ok == CouchService.authenticate(%CouchService.Credentials{name: name, password: password}) do
      conn
      |> put_flash(:info, info)
      |> UserAuth.log_in_user(name, user_params)
    else
      # In order to prevent user enumeration attacks, don't disclose whether the email is registered.
      conn
      |> put_flash(:error, "Invalid name or password")
      |> redirect(to: ~p"/ui/session/log_in")
    end
  end

  def delete(conn, _params) do
    conn
    |> put_flash(:info, "Logged out successfully.")
    |> UserAuth.log_out_user()
  end
end
