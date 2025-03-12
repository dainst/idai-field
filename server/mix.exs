defmodule FieldHub.MixProject do
  use Mix.Project

  def project do
    [
      app: :field_hub,
      version: "3.3.2",
      elixir: "~> 1.18",
      elixirc_paths: elixirc_paths(Mix.env()),
      compilers: Mix.compilers(),
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
      {:phoenix_live_view, "~> 1.0"},
      {:phoenix_live_dashboard, "~> 0.8"},
      {:phoenix_live_reload, "~> 1.5", only: :dev},
      {:floki, ">= 0.30.0", only: :test},
      {:esbuild, "~> 0.9", runtime: Mix.env() == :dev},
      {:sizeable, "~> 1.0"},
      {:swoosh, "~> 1.18"},
      {:telemetry_metrics, "~> 1.1"},
      {:telemetry_poller, "~> 1.1"},
      {:gettext, "~> 0.26"},
      {:jason, "~> 1.4"},
      {:plug_cowboy, "~> 2.7"},
      {:httpoison, "~> 2.2"},
      {:reverse_proxy_plug, "~> 2.4"},
      {:zarex, "~> 1.0"},
      {:ex_json_schema, "~> 0.10"},
      {:cachex, "~> 4.0"}
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
        "assets.setup",
        "assets.build"
      ],
      seed: [
        "run --eval 'FieldHub.CLI.create_project(\"#{dev_db_name}\", \"pw\"')"
      ],
      "assets.setup": ["esbuild.install --if-missing"],
      "assets.build": ["esbuild demo"],
      "assets.deploy": [
        "esbuild default --minify",
        "phx.digest"
      ]
    ]
  end
end
