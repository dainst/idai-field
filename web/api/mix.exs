defmodule Api.MixProject do
  use Mix.Project

  def project do
    [
      app: :api,
      version: "0.1.0",
      elixir: "~> 1.10",
      start_permanent: Mix.env() == :prod,
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
      {:poison, "~> 3.0"},
      {:plug, "~> 1.12"},
      {:plug_cowboy, "~> 2.5"},
      {:httpoison, "~> 1.8"},
      {:cowboy, "~> 2.9"},
      {:remix, "~> 0.0.2", only: :dev},
      {:guardian, "~> 2.2"},
      {:corsica, "~> 1.0"}
    ]
  end
end
