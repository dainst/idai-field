defmodule Api.MixProject do
  use Mix.Project

  def project do
    [
      app: :api,
      version: "0.1.0",
      elixir: "~> 1.14",
      start_permanent: Mix.env() == :prod,
      aliases: aliases(),
      deps: deps()
    ]
  end

  def application do
    [
      extra_applications: [:logger],
      mod: {Api.Application, []},
      remix: [:remix]
    ]
  end

  defp deps do
    [
      {:tesla, "~> 1.4"},
      {:ibrowse, "~> 4.2"},
      {:poison, "~> 3.0"}, # TODO remove in order to align with Phoenix/FieldHub default :jason
      {:jason, "~> 1.3"},
      {:plug, "~> 1.12"},
      {:plug_cowboy, "~> 2.5"},
      {:httpoison, "~> 1.8"},
      {:cowboy, "~> 2.9"},
      {:remix, "~> 0.0.2", only: :dev},
      {:guardian, "~> 2.2"},
      {:corsica, "~> 1.0"}
    ]
  end

  # Aliases are shortcuts or tasks specific to the current project.
  # For example, to install project dependencies and perform other setup tasks, run:
  #
  #     $ mix setup
  #
  # See the documentation for `Mix` for more info on aliases.
  defp aliases do
    [
      setup: [
        "deps.get",
        "cmd npm install --prefix priv/project_enricher",
        "cmd npm run build --prefix priv/project_enricher",
        "run --eval 'Api.Services.CouchService.initial_setup()'"
      ]
    ]
  end
end
