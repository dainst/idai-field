defmodule FieldHub.Application do
  # See https://hexdocs.pm/elixir/Application.html
  # for more information on OTP Applications
  @moduledoc false

  alias FieldHub.CouchService
  alias FieldHub.User

  use Application

  require Logger

  @file_directory_root Application.compile_env(:field_hub, :file_directory_root)

  @doc """
  Run basic setup for the whole application.
  """
  def setup() do
    Logger.info("Starting setup.")

    Logger.info(" Initializing CouchDB in 'single node' mode at '#{CouchService.base_url()}'.")
    # See https://docs.couchdb.org/en/3.2.0/setup/single-node.html

    {users, replicator} = CouchService.initial_setup()

    case users do
      %{status_code: 412} ->
        Logger.info(" System database '_users' already exists.")

      %{status_code: code} when 199 < code and code < 300 ->
        Logger.info(" Created system database `_users`.")
    end

    case replicator do
      %{status_code: 412} ->
        Logger.info(" System database '_replicator' already exists.")

      %{status_code: code} when 199 < code and code < 300 ->
        Logger.info(" Created system database `_replicator`.")
    end

    app_user = Application.get_env(:field_hub, :couchdb_user_name)

    User.create(
      app_user,
      Application.get_env(:field_hub, :couchdb_user_password)
    )
    |> case do
      :created ->
        Logger.info(" Created application user '#{app_user}'.")

      :already_exists ->
        Logger.info(" Application user '#{app_user}' already exists.")
    end

    tmp_file = "#{@file_directory_root}/.field_hub_test_file"

    File.write("#{@file_directory_root}/.field_hub_test_file", [])
    |> case do
      :ok ->
        File.rm(tmp_file)
        Logger.info(" Application is allowed write in file directory '#{@file_directory_root}'.")

      {:error, posix} ->
        throw(
          "Application got '#{posix}' posix error for write test in directory '#{@file_directory_root}'!"
        )
    end

    Logger.info("Setup finished.")
  end

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
    setup()

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
