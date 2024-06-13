defmodule FieldPublicationWeb.UserSessionController do
  use FieldPublicationWeb, :controller

  alias FieldPublication.CouchService
  alias FieldPublicationWeb.UserAuth

  def create(conn, params) do
    create(conn, params, "Welcome back!")
  end

  defp create(conn, %{"user" => %{"name" => name, "password" => password}} = form_params, info) do
    CouchService.authenticate(name, password)
    |> case do
      {:ok, :authenticated} ->
        conn
        |> put_flash(:info, info)
        |> UserAuth.log_in_user(name, form_params)

      _ ->
        conn
        |> put_flash(:error, "Invalid name or password")
        |> put_flash(:name, String.slice(name, 0, 160))
        |> redirect(to: ~p"/log_in")
    end
  end

  def delete(conn, _params) do
    UserAuth.log_out_user(conn)
  end
end
