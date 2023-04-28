defmodule FieldHub.MixProject do
  use Mix.Project

  def project do
    [
      app: :field_hub,
      version: "3.2.8",
      elixir: "~> 1.12",
      elixirc_paths: elixirc_paths(Mix.env()),
      compilers: [:gettext] ++ Mix.compilers(),
      start_permanent: Mix.env() == :prod,
      aliases: aliases(),
      deps: deps()
    ]
  end

  # Configuration for the OTP application.
  #
  # Type `mix help compile.app` for more information.
  def application do
    [
      mod: {FieldHub.Application, []},
      extra_applications: [:logger, :runtime_tools]
    ]
  end

  # Specifies which paths to compile per environment.
  defp elixirc_paths(:test), do: ["lib", "test/support"]
  defp elixirc_paths(_), do: ["lib"]

  # Specifies your project dependencies.
  #
  # Type `mix help deps` for examples and options.
  defp deps do
    [
      {:phoenix, "~> 1.6.6"},
      {:phoenix_html, "~> 3.0"},
      {:phoenix_live_reload, "~> 1.2", only: :dev},
      {:phoenix_live_view, "~> 0.17.5"},
      {:floki, ">= 0.30.0", only: :test},
      {:phoenix_live_dashboard, "~> 0.6"},
      {:esbuild, "~> 0.3", runtime: Mix.env() == :dev},
      {:sizeable, "~> 1.0"},
      {:swoosh, "~> 1.3"},
      {:telemetry_metrics, "~> 0.6"},
      {:telemetry_poller, "~> 1.0"},
      {:gettext, "~> 0.18"},
      {:jason, "~> 1.2"},
      {:plug_cowboy, "~> 2.5"},
      {:httpoison, "~> 1.8"},
      {:reverse_proxy_plug, "~> 2.1"},
      {:zarex, "~> 1.0.2"},
      {:ex_json_schema, "~> 0.9.1"},
      {:cachex, "~> 3.4"}
    ]
  end

  # Aliases are shortcuts or tasks specific to the current project.
  # For example, to install project dependencies and perform other setup tasks, run:
  #
  #     $ mix setup
  #
  # See the documentation for `Mix` for more info on aliases.
  defp aliases do
    dev_db_name = "development"

    [
      setup: [
        "deps.get",
        "setup_field_hub",
        "seed"
      ],
      setup_field_hub: [
        "run --eval 'FieldHub.CLI.setup()'"
      ],
      seed: [
        "run --eval 'FieldHub.CLI.create_project(\"#{dev_db_name}\", \"pw\"')"
      ],
      "assets.deploy": ["esbuild default --minify", "phx.digest"]
    ]
  end
end
