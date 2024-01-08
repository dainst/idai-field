defmodule FieldPublication.Replication do
  use GenServer

  require Logger

  alias Phoenix.PubSub

  alias FieldPublication.{
    CouchService,
    Replication.CouchReplication,
    Replication.FileReplication,
    Replication.MetadataGeneration,
    Publications
  }

  alias FieldPublication.Schemas.{
    ReplicationInput,
    Publication,
    LogEntry
  }

  def start_link(_opts) do
    Logger.debug("Starting Replication GenServer")
    GenServer.start_link(__MODULE__, [], name: __MODULE__)
  end

  def init(_) do
    Logger.debug("Initializing Replication GenServer state to empty map")
    # TODO: Rework state for each publication
    {:ok, %{}}
  end

  def initialize_publication(%ReplicationInput{} = params) do
    with {:ok, publication} <- Publications.create_from_replication_input(params),
         {:ok, :connection_successful} <- check_source_connection(params) do
      {:ok, publication}
    else
      {:error, %{errors: [duplicate_document: {msg, _}]}} ->
        {:error, msg}

      error ->
        error
    end
  end

  defp check_source_connection(%ReplicationInput{
         source_url: url,
         source_project_name: project_name,
         source_user: user,
         source_password: password
       }) do
    Finch.build(
      :head,
      "#{url}/db/#{project_name}",
      CouchService.headers(user, password)
    )
    |> Finch.request(FieldPublication.Finch)
    |> case do
      {:ok, %{status: 200, headers: headers}} ->
        Enum.find(headers, nil, fn {key, value} ->
          key == "server" and String.starts_with?(value, "CouchDB")
        end)
        |> case do
          nil ->
            {:error, :no_couchdb}

          _ ->
            {:ok, :connection_successful}
        end

      {:ok, %{status: 404}} ->
        {:error, :not_found}

      {:ok, %{status: 401}} ->
        {:error, :not_authorized}

      {:error, %Mint.TransportError{reason: :nxdomain}} ->
        {:error, :non_existent_domain}

      {:error, %Mint.TransportError{reason: :econnrefused}} ->
        {:error, :connection_refused}
    end
  end

  def start(%ReplicationInput{} = input, %Publication{} = publication) do
    GenServer.call(__MODULE__, {:start, input, publication})
  end

  def handle_call({:start, %ReplicationInput{} = input, %Publication{} = publication}, _from, running_replications) do
    publication_id = Publications.get_doc_id(publication)

    IO.inspect(publication)

    if publication_id in running_replications do
      {:reply, :already_running, running_replications}
    else
      initial_state = %{
        parameters: input,
        publication: publication,
        channel: publication_id
      }

      log(initial_state, :info, "Starting replication for #{publication_id}, replicating database.")
      task = Task.Supervisor.async_nolink(
        FieldPublication.TaskSupervisor,
        CouchReplication,
        :start,
        [initial_state]
      )

      {:reply, :ok, Map.put(running_replications, publication_id, {task, initial_state})}
    end
  end

  def handle_info({ref, %{publication: publication, database_result: :replicated, file_result: :replicated} = state}, running_replications) do
    publication_id = Publications.get_doc_id(publication)
    {:ok, state} = reconstruct_configuration_doc(state)


    {:ok, final_publication} =
      publication
      |> Publications.get!()
      |> Publications.put(%{"replication_finished" => DateTime.utc_now()})

    PubSub.broadcast(FieldPublication.PubSub, publication_id, {:replication_result, final_publication})
    log(state, :info, "Replication finished.")

    {:noreply, running_replications}
  end

  def handle_info({ref, %{publication: publication, database_result: :replicated} = state}, running_replications) do
    publication_id = Publications.get_doc_id(publication)
    log(state, :info, "Replicating files for #{publication_id}.")

    task = Task.Supervisor.async_nolink(
        FieldPublication.TaskSupervisor,
        FileReplication,
        :start,
        [state]
      )

    {:noreply, Map.put(running_replications, publication_id, {task, state})}
  end


  def start_replication(%ReplicationInput{} = params, %Publication{} = publication, channel) do
    setup_state = %{
      parameters: params,
      publication: publication,
      channel: channel
    }

    {:ok, replication_pid} =
      Task.Supervisor.start_child(FieldPublication.TaskSupervisor, fn ->
        replicate(setup_state)
      end)

    {:ok, setup_state, replication_pid}
  end

  defp replicate(
         %{publication: %{project_name: project_name}} =
           setup_state
       ) do
    log(setup_state, :info, "Starting replication for #{project_name}.")

    with {:ok, updated_state} <- replicate_database(setup_state),
         {:ok, updated_state} <- replicate_files(updated_state),
         {:ok, %{publication: publication, channel: channel} = updated_state} <-
           reconstruct_configuration_doc(updated_state) do
      log(updated_state, :info, "Replication finished.")

      {:ok, final_publication} =
        publication
        |> Publications.get!()
        |> Publications.put(%{"replication_finished" => DateTime.utc_now()})

      PubSub.broadcast(FieldPublication.PubSub, channel, {:replication_result, final_publication})
    else
      error ->
        {:noreply, error}
    end
  end

  defp replicate_database(state) do
    log(state, :info, "Starting database replication.")

    CouchReplication.start(state)
    |> case do
      {:ok, :completed} ->
        log(state, :info, "Database replication has finished.")
        {:ok, Map.put(state, :database_result, :replicated)}

      {:error, _} = error ->
        log(state, :error, "Database replication has failed.")
        error
    end
  end

  defp replicate_files(state) do
    log(state, :info, "Starting file replication.")

    {:ok, file_results} = FileReplication.start(state)

    log(state, :info, "File replication has finished.")

    {:ok, Map.put(state, :file_results, file_results)}
  end

  defp reconstruct_configuration_doc(%{publication: publication} = state) do
    log(state, :info, "Creating publication metadata.")

    {:ok, result} = MetadataGeneration.reconstruct_project_konfiguraton(publication)

    log(state, :info, "Publication metadata created.")

    {:ok, Map.put(state, :project_configuration_recreation, result)}
  end

  def log(%{publication: %Publication{} = publication, channel: channel}, severity, msg) do
    case severity do
      :error ->
        Logger.error(msg)

      :warning ->
        Logger.error(msg)

      _ ->
        Logger.debug(msg)
    end

    {:ok, log_entry} =
      LogEntry.create(%{
        severity: severity,
        timestamp: DateTime.utc_now(),
        message: msg
      })

    publication
    |> Publications.get!()
    |> Map.update(:replication_logs, [], fn existing -> existing ++ [log_entry] end)
    |> Publications.put(%{})

    PubSub.broadcast(FieldPublication.PubSub, channel, {:replication_log, log_entry})
  end

  def handle_info({:DOWN, ref, :process, _pid, :normal}, running_tasks) do
    Logger.debug("A replication task has completed successfully.")
    # TODO: Remove from running_tasks
    {:noreply, running_tasks}
  end
end
