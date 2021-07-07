defmodule IdaiFieldServerWeb.PageController do
  use IdaiFieldServerWeb, :controller

  def index(conn, _params) do
    render(conn, "index.html")
  end
end
