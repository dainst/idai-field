# This file is responsible for configuring your application
# and its dependencies with the aid of the Config module.
#
# This configuration file is loaded before any dependency and
# is restricted to this project.

# General application configuration
import Config

# Configures the endpoint
config :field_publication, FieldPublicationWeb.Endpoint,
  url: [host: "localhost"],
  render_errors: [
    formats: [html: FieldPublicationWeb.ErrorHTML, json: FieldPublicationWeb.ErrorJSON],
    layout: false
  ],
  pubsub_server: FieldPublication.PubSub,
  live_view: [signing_salt: "K/pS/S7t"]

config :field_publication,
  user_tokens_cache_name: :user_tokens,
  dev_routes: true,
  file_variants_to_replicate: ["original_image"],
  core_database: "field_publication",
  file_store_directory_root: "data/file_store",
  couchdb_url: "http://localhost:5985",
  couchdb_admin_name: "couch_admin",
  couchdb_admin_password: "couch_admin_password",
  opensearch_url: "http://localhost:9200",
  opensearch_admin_password: "Test123!",
  cantaloupe_url: "http://localhost:8182"

# Configures the mailer
#
# By default it uses the "Local" adapter which stores the emails
# locally. You can see the emails in your browser, at "/dev/mailbox".
#
# For production it's recommended to configure a different adapter
# at the `config/runtime.exs`.
config :field_publication, FieldPublication.Mailer, adapter: Swoosh.Adapters.Local

# Configure esbuild (the version is required)
config :esbuild,
  version: "0.17.11",
  default: [
    args:
      ~w(js/app.js --bundle --target=es2017 --outdir=../priv/static/assets --external:/fonts/* --external:/images/*),
    cd: Path.expand("../assets", __DIR__),
    env: %{"NODE_PATH" => Path.expand("../deps", __DIR__)}
  ]

# Configure tailwind (the version is required)
config :tailwind,
  version: "3.4.3",
  default: [
    args: ~w(
      --config=tailwind.config.js
      --input=css/app.css
      --output=../priv/static/assets/app.css
    ),
    cd: Path.expand("../assets", __DIR__)
  ],
  open_layers: [
    args: ~w(
      --input=node_modules/ol/ol.css
      --output=../priv/static/assets/ol.css
    ),
    cd: Path.expand("../assets", __DIR__)
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
