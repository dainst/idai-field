defmodule IdaiFieldServerWeb.PageController do
  use IdaiFieldServerWeb, :controller

  def index(conn, _params) do

    url = "https://api.github.com/repos/dainst/idai-field/releases/latest"
    headers = [{"Accept", "application/vnd.github.v3+json"}]
    {:ok, response} = HTTPoison.get url, headers, []
    answer = Poison.decode! response.body

    tag_name = answer["tag_name"]
    tag_name = String.slice tag_name, 1..-1

    render(conn, "index.html", latest_tag: tag_name)
  end
end
