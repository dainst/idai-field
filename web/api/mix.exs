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
      {:tesla, "~> 1.3.0"},
      {:ibrowse, "~> 4.2"},
      {:poison, "~> 3.0"},
      {:plug, "~> 1.6"},
      {:plug_cowboy, "~> 2.0"},
      {:httpoison, "~> 1.7.0"},
      {:cowboy, "~> 2.4"},
      {:remix, "~> 0.0.1", only: :dev},
      {:guardian, "~> 2.0"}
    ]
  end
end
