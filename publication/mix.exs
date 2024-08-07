defmodule FieldPublication.MixProject do
  use Mix.Project

  def project do
    [
      app: :field_publication,
      version: "0.1.0",
      elixir: "~> 1.14",
      elixirc_paths: elixirc_paths(Mix.env()),
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
      mod: {FieldPublication.Application, []},
      extra_applications: [:logger, :runtime_tools]
    ]
  end

  # Specifies which paths to compile per environment.
  defp elixirc_paths(:test), do: ["lib", "test/support"]
  defp elixirc_paths(:dev), do: ["lib", "test/support/fixtures/seed_project"]
  defp elixirc_paths(_), do: ["lib"]

  # Specifies your project dependencies.
  #
  # Type `mix help deps` for examples and options.
  defp deps do
    [
      {:phoenix, "~> 1.7.11"},
      {:phoenix_ecto, "~> 4.5.1"},
      {:phoenix_html, "~> 4.1.1"},
      {:phoenix_live_reload, "~> 1.5", only: :dev},
      {:phoenix_live_view, "~> 0.20.14"},
      {:earmark, "~> 1.4"},
      {:floki, "~> 0.36", only: :test},
      {:geo, "~> 3.6"},
      {:phoenix_live_dashboard, "~> 0.8.3"},
      {:esbuild, "~> 0.7", runtime: Mix.env() == :dev},
      {:tailwind, "~> 0.2.2", runtime: Mix.env() == :dev},
      {:swoosh, "~> 1.3"},
      {:finch, "~> 0.13"},
      # httpoison is required for reverse_proxy_plug, otherwise it duplicates finch
      {:httpoison, "~> 2.2.1"},
      {:reverse_proxy_plug, "~> 2.4.1"},
      {:telemetry_metrics, "~> 0.6"},
      {:telemetry_poller, "~> 1.0"},
      {:gettext, "~> 0.20"},
      {:jason, "~> 1.2"},
      {:plug_cowboy, "~> 2.5"},
      {:iso639_elixir, "~> 0.2.1"},
      {:cachex, "~> 3.6"}
    ]
  end

  # Aliases are shortcuts or tasks specific to the current project.
  # For example, to install project dependencies and perform other setup tasks, run:
  #
  #     $ mix setup
  #
  # See the documentation for `Mix` for more info on aliases.
  defp aliases do
    seed_project_name = "test"

    [
      setup: [
        "deps.get",
        "cmd npm install --prefix assets",
        "assets.setup",
        "assets.build",
        "cmd npm install --prefix priv/publication_enricher",
        "cmd npm run build --prefix priv/publication_enricher"
      ],
      "assets.setup": ["tailwind.install --if-missing", "esbuild.install --if-missing"],
      "assets.build": ["tailwind default", "tailwind open_layers", "esbuild default"],
      "assets.deploy": [
        "tailwind default --minify",
        "tailwind open_layers --minify",
        "esbuild default --minify",
        "phx.digest"
      ],
      seed: [
        "run --eval 'FieldPublication.Test.ProjectSeed.start(\"testopolis\")'"
      ]
    ]
  end
end
