import Config

config :logger, :console,
  format: {Api.IdaiConsoleLogger, :format},
  metadata: [:mfa]

config :tesla, :adapter, Tesla.Adapter.Ibrowse

config :api,
  port: 4001

import_config "#{Mix.env()}.exs"
