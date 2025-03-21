# This file is responsible for configuring your application
# and its dependencies with the aid of the Config module.
#
# This configuration file is loaded before any dependency and
# is restricted to this project.
#
# The other environment configurations (dev/test/prod/runtime) may override
# the configuration done here where necessary.
# See import_config/1 call at the bottom.

# General application configuration
import Config

# Configures the endpoint
config :field_hub, FieldHubWeb.Endpoint,
  url: [host: "localhost"],
  render_errors: [
    formats: [html: FieldHubWeb.ErrorHTML, json: FieldHubWeb.ErrorJSON],
    layout: false
  ],
  pubsub_server: FieldHub.PubSub,
  live_view: [signing_salt: "upiryQ4e"]

config :field_hub,
  couchdb_url: "http://localhost:5984",
  # see .env_template
  couchdb_admin_name: "couch_admin",
  # see .env_template
  couchdb_admin_password: "couch_admin_password",
  couchdb_user_name: "app_user",
  couchdb_user_password: "app_user_password",
  valid_file_variants: [:thumbnail_image, :original_image],
  file_index_cache_name: :file_info,
  file_max_size: 1_000_000_000,
  user_tokens_cache_name: :user_tokens,
  max_project_identifier_length: 30

# Configure esbuild (the version is required)
config :esbuild,
  version: "0.14.0",
  default: [
    args:
      ~w(js/app.js --bundle --target=es2017 --outdir=../priv/static/assets --external:/fonts/* --external:/images/*),
    cd: Path.expand("../assets", __DIR__),
    env: %{"NODE_PATH" => Path.expand("../deps", __DIR__)}
  ]

# Configures Elixir's Logger
config :logger, :console,
  format: "$time $metadata[$level] $message\n",
  metadata: [:request_id]

# Use Jason for JSON parsing in Phoenix
config :phoenix, :json_library, Jason
config :reverse_proxy_plug, :http_client, ReverseProxyPlug.HTTPClient.Adapters.HTTPoison
# Import environment specific config. This must remain at the bottom
# of this file so it overrides the configuration defined above.
import_config "#{config_env()}.exs"
