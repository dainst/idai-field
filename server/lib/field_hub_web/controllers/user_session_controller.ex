defmodule FieldHubWeb.UserSessionController do
  use FieldHubWeb, :controller

  alias FieldHub.CouchService
  alias FieldHubWeb.UserAuth

  def new(conn, _params) do
    render(conn, "new.html", error_message: nil)
  end

  def create(conn, %{"user" => %{"name" => name, "password" => password} = user_params}) do
    case CouchService.authenticate(%CouchService.Credentials{name: name, password: password}) do
      :ok ->
        UserAuth.log_in_user(conn, name, user_params)

      _ ->
        # In order to prevent user enumeration attacks, don't disclose whether the email is registered.
        render(conn, "new.html", error_message: "Invalid name or password")
    end
  end

  def delete(conn, _params) do
    conn
    |> UserAuth.log_out_user()
    |> put_flash(:info, "Logged out successfully.")
  end
end
