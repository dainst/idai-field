defmodule ForbiddenController do
  use IdaiFieldServerWeb, :controller

  def forbid conn, _params do
    conn
    |> send_resp(403, "Not allowed")
    |> halt
  end
end
