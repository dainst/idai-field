defmodule FieldHub.Application do
  # See https://hexdocs.pm/elixir/Application.html
  # for more information on OTP Applications
  @moduledoc false

  use Application

  require Logger

  @impl true
  def start(_type, _args) do
    children = [
      # Start the Telemetry supervisor
      FieldHubWeb.Telemetry,
      # Start the PubSub system
      {Phoenix.PubSub, name: FieldHub.PubSub},
      # Start the Endpoint (http/https)
      FieldHubWeb.Endpoint,
      # Start a worker by calling: FieldHub.Worker.start_link(arg)
      # {FieldHub.Worker, arg}
      Supervisor.child_spec(
        {Cachex, name: Application.get_env(:field_hub, :file_index_cache_name)},
        id: :file_info_cache
      ),
      Supervisor.child_spec(
        {Cachex, name: Application.get_env(:field_hub, :user_tokens_cache_name)},
        id: :user_tokens_cache
      )
    ]

    # Run the FieldHub setup
    FieldHub.CLI.setup()

    # See https://hexdocs.pm/elixir/Supervisor.html
    # for other strategies and supported options
    opts = [strategy: :one_for_one, name: FieldHub.Supervisor]
    Supervisor.start_link(children, opts)
  end

  # Tell Phoenix to update the endpoint configuration
  # whenever the application is updated.
  @impl true
  def config_change(changed, _new, removed) do
    FieldHubWeb.Endpoint.config_change(changed, removed)
    :ok
  end
end
