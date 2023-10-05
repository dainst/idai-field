defmodule FieldPublication.Replication do
  require Logger

  alias Phoenix.PubSub

  alias FieldPublication.{
    CouchService,
    Replication.CouchReplication,
    Replication.FileReplication,
    Replication.MetadataGeneration
  }

  alias FieldPublication.Schemas.{
    ReplicationInput,
    Publication,
    LogEntry
  }

  def start(%ReplicationInput{} = params) do
    with {:ok, publication} <- Publication.create_from_replication_input(params),
         {:ok, :connection_successful} <- check_source_connection(params),
         channel <- Publication.get_doc_id(publication) do
      {:ok, log_cache_pid} = Agent.start_link(fn -> [] end, name: String.to_atom(channel))

      state = %{
        parameters: params,
        publication: publication,
        channel: channel,
        log_cache: log_cache_pid
      }

      {:ok, replication_pid} =
        Task.Supervisor.start_child(FieldPublication.TaskSupervisor, fn ->
          replicate(state)
        end)

      {:ok, state, replication_pid}
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

  defp replicate(
         %{publication: %{project_name: project_name} = publication} =
           state
       ) do
    log(state, :info, "Starting replication for #{project_name}.")

    with {:ok, updated_state} <- replicate_database(state),
         {:ok, updated_state} <- replicate_files(updated_state),
         {:ok, %{log_cache: log_cache_pid} = state} <-
           reconstruct_configuration_doc(updated_state) do
      log(state, :info, "Replication finished.")

      logs = Agent.get(log_cache_pid, fn values -> values end)

      Agent.stop(log_cache_pid)

      {:ok, final_publication} =
        Publication.put(Map.put(publication, :replication_logs, logs))

      broadcast(state.channel, {:result, state})
      {:noreply, %{state | publication: final_publication}}
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

  def log(%{channel: channel, log_cache: pid}, severity, msg) do
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

    Agent.update(pid, fn existing_list -> existing_list ++ [log_entry] end)
    PubSub.broadcast(FieldPublication.PubSub, channel, {:log, :replication_logs, log_entry})
  end

  def broadcast(channel, {:result, result}) do
    PubSub.broadcast(FieldPublication.PubSub, channel, {:replication_result, result})
  end
end
