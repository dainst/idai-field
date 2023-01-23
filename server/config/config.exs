# This file is responsible for configuring your application
# and its dependencies with the aid of the Config module.
#
# This configuration file is loaded before any dependency and
# is restricted to this project.

# General application configuration
import Config

# Configures the endpoint
config :field_hub, FieldHubWeb.Endpoint,
  url: [host: "localhost"],
  render_errors: [view: FieldHubWeb.ErrorView, accepts: ~w(html json), layout: false],
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
  user_tokens_cache_name: :user_tokens

# Configures the mailer
#
# By default it uses the "Local" adapter which stores the emails
# locally. You can see the emails in your browser, at "/dev/mailbox".
#
# For production it's recommended to configure a different adapter
# at the `config/runtime.exs`.
config :field_hub, FieldHub.Mailer, adapter: Swoosh.Adapters.Local

# Swoosh API client is needed for adapters other than SMTP.
config :swoosh, :api_client, false

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
