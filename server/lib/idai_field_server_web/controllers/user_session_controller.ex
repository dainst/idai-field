defmodule IdaiFieldServerWeb.UserSessionController do
  use IdaiFieldServerWeb, :controller

  alias IdaiFieldServer.CouchdbDatastore
  alias IdaiFieldServer.Accounts
  alias IdaiFieldServerWeb.UserAuth

  def new(conn, _params) do
    render(conn, "new.html", error_message: nil)
  end

  ## TODO revoke token on log out

  def create(conn, %{"user" => user_params}) do
    %{"username" => username, "password" => password} = user_params

    if user = CouchdbDatastore.authorize(username, password) do
    # if user = Accounts.get_user_by_email_and_password(username, password) do
      UserAuth.log_in_user(conn, user, user_params)
    else
      render(conn, "new.html", error_message: "Invalid e-mail or password")
    end
  end

  def delete(conn, _params) do
    conn
    |> put_flash(:info, "Logged out successfully.")
    |> UserAuth.log_out_user()
  end
end
