defmodule FieldPublication.Application do
  # See https://hexdocs.pm/elixir/Application.html
  # for more information on OTP Applications
  @moduledoc false
  alias FieldPublication.Settings
  alias FieldPublication.FileService
  alias FieldPublication.CouchService

  use Application

  @impl true
  def start(_type, _args) do
    children = [
      # Start the Telemetry supervisor
      FieldPublicationWeb.Telemetry,
      # Start the PubSub system
      {Phoenix.PubSub, name: FieldPublication.PubSub},
      # Start Finch
      {Finch, name: FieldPublication.Finch},
      # Start the Endpoint (http/https)
      FieldPublicationWeb.Endpoint,
      {Task.Supervisor, name: FieldPublication.TaskSupervisor},
      {Task.Supervisor, name: FieldPublication.ProcessingSupervisor},
      {FieldPublication.Replication, %{}},
      {FieldPublication.Processing, []},
      Supervisor.child_spec(
        {Cachex, name: Application.get_env(:field_publication, :user_tokens_cache_name)},
        id: :user_tokens_cache
      ),
      Supervisor.child_spec(
        {Cachex, name: :document_cache},
        id: :document_cache
      ),
      Supervisor.child_spec({Cachex, name: :application_documents}, id: :application_documents),
      Supervisor.child_spec({Cachex, name: :published_images}, id: :published_images)
    ]

    # See https://hexdocs.pm/elixir/Supervisor.html
    # for other strategies and supported options
    opts = [strategy: :one_for_one, name: FieldPublication.Supervisor]

    supervisor_startup = Supervisor.start_link(children, opts)

    # Once all child processes are started, run the CouchDB setup.
    CouchService.initial_setup()
    FileService.initial_setup()
    Settings.load()

    supervisor_startup
  end

  # Tell Phoenix to update the endpoint configuration
  # whenever the application is updated.
  @impl true
  def config_change(changed, _new, removed) do
    FieldPublicationWeb.Endpoint.config_change(changed, removed)
    :ok
  end
end

defimpl Jason.Encoder,
  for: [
    FieldPublication.DatabaseSchema.Project,
    FieldPublication.DatabaseSchema.Publication,
    FieldPublication.DatabaseSchema.ApplicationSettings
  ] do
  def encode(document, opts) do
    document
    |> Map.from_struct()
    |> Map.reject(fn {k, v} -> k == :_rev and is_nil(v) end)
    |> Map.put(
      :_id,
      FieldPublication.DatabaseSchema.Base.construct_doc_id(
        document,
        document.__struct__
      )
    )
    |> Jason.Encode.map(opts)
  end
end

defimpl Jason.Encoder,
  for: [
    FieldPublication.DatabaseSchema.DataPreview,
    FieldPublication.DatabaseSchema.DataIssues
  ] do
  def encode(document, opts) do
    document
    |> Map.from_struct()
    |> Map.reject(fn {k, v} -> k == :_rev and is_nil(v) end)
    |> Map.put(:_id, document.__struct__.id(document))
    |> Jason.Encode.map(opts)
  end
end

# This tells phoenix how to use date fields (like those of the Publication schema) as part of URLs in path helpers (~p sigils etc. used in templates).
defimpl Phoenix.Param, for: Date do
  def to_param(date) do
    Date.to_string(date)
  end
end
