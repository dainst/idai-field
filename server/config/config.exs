# This file is responsible for configuring your application
# and its dependencies with the aid of the Mix.Config module.
#
# This configuration file is loaded before any dependency and
# is restricted to this project.

# General application configuration
use Mix.Config

config :idai_field_server,
  ecto_repos: [IdaiFieldServer.Repo]

# Configures the endpoint
config :idai_field_server, IdaiFieldServerWeb.Endpoint,
  url: [host: "localhost"],
  secret_key_base: "1ipNW9Ki6wxRUsNGJbWbndWQgEOIFLVoPPT5gLrthGr5JONKN98YuP3lPaYpnzyQ",
  render_errors: [view: IdaiFieldServerWeb.ErrorView, accepts: ~w(html json), layout: false],
  pubsub_server: IdaiFieldServer.PubSub,
  live_view: [signing_salt: "1zikrhCS"]

# Configures Elixir's Logger
config :logger, :console,
  format: "$time $metadata[$level] $message\n",
  metadata: [:request_id]

# Use Jason for JSON parsing in Phoenix
config :phoenix, :json_library, Jason

# Import environment specific config. This must remain at the bottom
# of this file so it overrides the configuration defined above.
import_config "#{Mix.env()}.exs"
