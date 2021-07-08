defmodule IdaiFieldServer.Repo do
  use Ecto.Repo,
    otp_app: :idai_field_server,
    adapter: Ecto.Adapters.Postgres
end
