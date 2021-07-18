use Mix.Config

# Only in tests, remove the complexity from the password hashing algorithm
config :bcrypt_elixir, :log_rounds, 1

# Configure your database
#
# The MIX_TEST_PARTITION environment variable can be used
# to provide built-in test partitioning in CI environment.
# Run `mix help test` for more information.
config :idai_field_server, IdaiFieldServer.Repo,
  username: "postgres",
  password: "abcdef",
  database: "idai_field_server_test#{System.get_env("MIX_TEST_PARTITION")}",
  hostname: (if System.get_env("IN_CONTAINER") == "true" do "postgres" else "localhost" end),
  pool: Ecto.Adapters.SQL.Sandbox

# We don't run a server during test. If one is required,
# you can enable the server option below.
config :idai_field_server, IdaiFieldServerWeb.Endpoint,
  http: [port: 4002],
  server: false

# Print only warnings and errors during test
config :logger, level: :warn
