defmodule FieldPublication.Application do
  # See https://hexdocs.pm/elixir/Application.html
  # for more information on OTP Applications
  @moduledoc false
  require Logger
  alias FieldPublication.Settings
  alias FieldPublication.FileService
  alias FieldPublication.CouchService

  use Application

  @required_node_version 24

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

    check_node_version()
    |> extract_major_node_version()
    |> parse_major_node_version()
    |> compare_major_node_version()
    |> case do
      {:error, msg} ->
        raise msg

      :ok ->
        Logger.debug("Node version >= #{@required_node_version} found.")
        :ok
    end

    supervisor_startup
  end

  defp check_node_version() do
    case System.cmd("node", ["-v"]) do
      {output, 0} ->
        {:ok, output}

      _ ->
        {:error, "Did not find node, required version is >= #{@required_node_version}."}
    end
  end

  defp extract_major_node_version({:ok, cmd_result}) do
    pattern = ~r/^v(\d+)\..*$/

    case Regex.run(pattern, cmd_result) do
      [_full_string, maybe_number] ->
        {:ok, maybe_number}

      _ ->
        {:error, "Failed to parse node version from #{cmd_result}."}
    end
  end

  defp extract_major_node_version({:error, _} = error) do
    error
  end

  defp parse_major_node_version({:ok, maybe_number}) do
    case Integer.parse(maybe_number) do
      {number, ""} ->
        {:ok, number}

      _ ->
        {:error, "Unable to parse #{maybe_number} as integer."}
    end
  end

  defp parse_major_node_version({:error, _} = error) do
    error
  end

  defp compare_major_node_version({:ok, number}) do
    if number < @required_node_version do
      {:error, "Minimum node version is #{@required_node_version}, got #{number}."}
    else
      :ok
    end
  end

  defp compare_major_node_version({:error, _} = error) do
    error
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
