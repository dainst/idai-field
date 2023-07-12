import Config

# We don't run a server during test. If one is required,
# you can enable the server option below.
config :field_publication, FieldPublicationWeb.Endpoint,
  http: [ip: {127, 0, 0, 1}, port: 4003],
  secret_key_base: "EAyenmvlCto4cZkeagygzKT29+QCgxaEqyq8PXBHsQ5qmxnOqd+cCfJwHWD77aL7",
  server: false

# In test we don't send emails.
config :field_publication, FieldPublication.Mailer, adapter: Swoosh.Adapters.Test

config :field_publication,
  development_mode: true

# Disable swoosh api client as it is only required for production adapters.
config :swoosh, :api_client, false

# Print only warnings and errors during test
config :logger, level: :warning

# Initialize plugs at runtime for faster test compilation
config :phoenix, :plug_init_mode, :runtime
