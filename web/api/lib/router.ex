defmodule Api.Router do
  use Plug.Router

  plug :match
  plug Corsica, origins: "*"

  plug(Plug.Parsers,
    parsers: [:json],
    pass: ["application/json"],
    json_decoder: Poison
  )

  plug :dispatch

  forward("/api/documents", to: Api.Documents.Router)
  forward("/api/images", to: Api.Images.Router)
  forward("/api/auth", to: Api.Auth.Router)
  forward("/api/statistics", to: Api.Statistics.Router)
  forward("/api/worker", to: Api.Worker.Router)

  match _ do
    send_resp(conn, 404, "Requested page not found!")
  end

  def child_spec(opts) do
    %{
      id: __MODULE__,
      start: {__MODULE__, :start_link, [opts]}
    }
  end

  def start_link(_opts) do
    :ets.new(:indexing, [:set, :public, :named_table]) # TODO make it protected or private
    Plug.Cowboy.http(__MODULE__, [])
  end
end
