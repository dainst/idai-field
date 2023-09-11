defmodule FieldPublication.Replication do
  alias Phoenix.PubSub

  defmodule LogEntry do
    @enforce_keys [:name, :severity, :timestamp, :msg]
    defstruct [:name, :severity, :timestamp, :msg]
  end

  alias FieldPublication.{
    CouchService,
    FileService,
    Schema.Project,
    Schema.Publication,
    Replication.CouchReplication,
    Replication.FileReplication,
    Replication.Parameters,
    Replication.MetadataGeneration
  }

  require Logger

  @log_cache Application.get_env(:field_publication, :replication_log_cache_name)

  def start(%Parameters{project_key: project_key} = params, broadcast_channel) do
    publication = MetadataGeneration.create_publication(params)

    with {:ok, :connection_successful} <- check_source_connection(params),
         {:ok, _} <- ensure_no_existing_publication(params, publication, broadcast_channel) do
      broadcast(broadcast_channel, %LogEntry{
        name: :start,
        severity: :ok,
        timestamp: DateTime.utc_now(),
        msg: "Starting replication for #{project_key}."
      })

      Task.Supervisor.start_child(FieldPublication.Replication.Supervisor, fn ->
        replicate(params, publication, broadcast_channel)
      end)

      {:ok, :started}
    else
      error ->
        error
    end
  end

  defp ensure_no_existing_publication(
         %Parameters{
           delete_existing_publication: true
         } = parameters,
         %Publication{} = publication,
         channel
       ) do
    delete_existing_publication(parameters, publication, channel)

    {:ok, :deleted_existing}
  end

  defp ensure_no_existing_publication(
         %Parameters{} = parameters,
         %Publication{} = publication,
         _channel
       ) do
    project = Project.get_project!(parameters.project_key)

    project.publications
    |> Enum.any?(fn p -> p.draft_date == publication.draft_date end)
    |> case do
      true ->
        {:error, :existing_publication}

      false ->
        parameters
        |> CouchReplication.get_replication_doc()
        |> case do
          {:ok, %{"_replication_state" => "completed"}} ->
            {:ok, :no_publication}

          {:ok, _} ->
            {:error, :active_replication}

          {:error, :not_found} ->
            {:ok, :no_publication}
        end
    end
  end

  defp check_source_connection(%Parameters{
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

  defp delete_existing_publication(
         %Parameters{} = parameters,
         %Publication{} = publication,
         channel
       ) do
    Cachex.del(@log_cache, channel)

    replication_stop =
      CouchReplication.stop_replication(publication.database)
      |> case do
        {:ok, :deleted} = result ->
          broadcast(channel, %LogEntry{
            name: :started,
            severity: :ok,
            timestamp: DateTime.utc_now(),
            msg: "Removed existing replication document."
          })

          result

        result ->
          result
      end

    publication_deletion =
      CouchService.delete_database(publication.database)
      |> case do
        {:ok, %{status: 200}} ->
          broadcast(channel, %LogEntry{
            name: :started,
            severity: :ok,
            timestamp: DateTime.utc_now(),
            msg: "Removed existing publication database."
          })

          {:ok, :deleted}

        {:ok, %{status: 404}} ->
          {:ok, :already_deleted}
      end

    file_deletion =
      FileService.delete_publication(parameters.project_key, publication.draft_date)
      |> case do
        {:ok, []} ->
          {:ok, :already_deleted}

        {:ok, _list_of_deleted_files} ->
          broadcast(channel, %LogEntry{
            name: :started,
            severity: :ok,
            timestamp: DateTime.utc_now(),
            msg: "Removed existing publication files."
          })

          {:ok, :deleted}
      end

    {replication_stop, publication_deletion, file_deletion}
  end

  defp replicate(
         %Parameters{project_key: project_key} = parameters,
         %Publication{} = publication,
         channel
       ) do
    {:ok, %{broadcast_channel: channel}}
    |> replicate_database(parameters, publication)
    |> replicate_files(parameters, publication)
    |> reconstruct_configuration_doc(publication)
    |> then(fn result_or_error ->
      Cachex.del(@log_cache, channel)

      {:ok, updated_project} =
        project_key
        |> Project.get_project!()
        |> Project.add_publication(publication)

      broadcast(channel, {:result, result_or_error})
    end)
  end

  defp replicate_database(
         {:ok, %{broadcast_channel: channel} = replication_state},
         %Parameters{} = params,
         %Publication{} = publication
       ) do
    broadcast(channel, %LogEntry{
      name: :db_start,
      severity: :ok,
      timestamp: DateTime.utc_now(),
      msg: "Starting database replication."
    })

    params
    |> CouchReplication.start(publication.database, channel)
    |> case do
      {:ok, :completed} ->
        broadcast(channel, %LogEntry{
          name: :database_replication_finished,
          severity: :ok,
          timestamp: DateTime.utc_now(),
          msg: "Database replication has finished."
        })

        {:ok, Map.put(replication_state, :database_result, :replicated)}

      {:error, name} = error ->
        broadcast(channel, %LogEntry{
          name: name,
          severity: :error,
          timestamp: DateTime.utc_now(),
          msg: "Database replication has failed."
        })

        error
    end
  end

  defp replicate_files({:error, _} = error, _, _) do
    error
  end

  defp replicate_files(
         {:ok, %{broadcast_channel: channel} = replication_state},
         %Parameters{} = params,
         %Publication{} = publication
       ) do
    broadcast(channel, %LogEntry{
      name: :start_file_replication,
      severity: :ok,
      timestamp: DateTime.utc_now(),
      msg: "Starting file replication."
    })

    {:ok, file_results} = FileReplication.start(params, publication, channel)

    broadcast(channel, %LogEntry{
      name: :file_replication_finished,
      severity: :ok,
      timestamp: DateTime.utc_now(),
      msg: "File replication has finished."
    })

    {:ok, Map.put(replication_state, :file_results, file_results)}
  end

  defp reconstruct_configuration_doc({:error, _} = error, _) do
    error
  end

  defp reconstruct_configuration_doc(
         {:ok, %{broadcast_channel: channel} = replication_state},
         %Publication{} = publication
       ) do
    broadcast(channel, %LogEntry{
      name: :publication_configuration_recreated,
      severity: :ok,
      timestamp: DateTime.utc_now(),
      msg: "Creating publication metadata."
    })

    {:ok, result} = MetadataGeneration.reconstruct_project_konfiguraton(publication)

    broadcast(channel, %LogEntry{
      name: :publication_configuration_recreated,
      severity: :ok,
      timestamp: DateTime.utc_now(),
      msg: "Publication metadata created."
    })

    {:ok, Map.put(replication_state, :project_configuration_recreation, result)}
  end

  def broadcast(channel, %LogEntry{severity: severity, msg: msg} = log_entry) do
    case severity do
      :error ->
        Logger.error(msg)

      _ ->
        Logger.debug(msg)
    end

    case Cachex.get(@log_cache, channel) do
      {:ok, nil} ->
        Cachex.put(@log_cache, channel, [log_entry], ttl: :timer.hours(5))

      {:ok, entries} ->
        Cachex.put(@log_cache, channel, entries ++ [log_entry])
    end

    PubSub.broadcast(FieldPublication.PubSub, channel, {:replication_log, log_entry})
  end

  def broadcast(channel, {:result, result}) do
    PubSub.broadcast(FieldPublication.PubSub, channel, {:replication_result, result})
  end
end
