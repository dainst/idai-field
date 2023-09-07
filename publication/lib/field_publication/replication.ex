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
    Replication.CouchReplication,
    Replication.FileReplication,
    Replication.Parameters,
    Replication.MetadataGeneration
  }

  require Logger

  def start(%Parameters{local_project_name: local_project_name} = params, broadcast_channel) do
    with {:ok, :connection_successful} <- check_source_connection(params),
         {:ok, _} <- ensure_no_existing_publication(params, broadcast_channel) do
      broadcast(broadcast_channel, %LogEntry{
        name: :start,
        severity: :ok,
        timestamp: DateTime.utc_now(),
        msg: "Starting replication for #{local_project_name}."
      })

      Task.Supervisor.start_child(FieldPublication.Replication.Supervisor, fn ->
        replicate(params, broadcast_channel)
      end)

      {:ok, :started}
    else
      error ->
        error
    end
  end

  defp ensure_no_existing_publication(
         %Parameters{
           local_project_name: name,
           local_delete_existing: true
         },
         channel
       ) do
    name
    |> generate_publication_name()
    |> delete_existing_publication(channel)

    {:ok, :deleted_existing}
  end

  defp ensure_no_existing_publication(
         %Parameters{
           local_project_name: name
         },
         _channel
       ) do
    project = Project.get_project!(name)

    project.publications
    |> Enum.any?(fn publication -> publication.draft_date == Date.utc_today() end)
    |> case do
      true ->
        {:error, :existing_publication}

      false ->
        name
        |> generate_publication_name()
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

  defp replicate(
         %Parameters{
           local_project_name: project_name
         } = parameters,
         channel
       ) do
    publication_name = generate_publication_name(project_name)

    broadcast(channel, %LogEntry{
      name: :db_start,
      severity: :ok,
      timestamp: DateTime.utc_now(),
      msg: "Starting database replication."
    })

    parameters
    |> CouchReplication.start(publication_name, channel)
    |> case do
      {:ok, :completed} ->
        broadcast(channel, %LogEntry{
          name: :database_replication_finished,
          severity: :ok,
          timestamp: DateTime.utc_now(),
          msg: "Database replication has finished."
        })

        {:ok, %{couch_result: :successful}}

      {:error, name} = error ->
        broadcast(channel, %LogEntry{
          name: name,
          severity: :error,
          timestamp: DateTime.utc_now(),
          msg: "Database replication has failed."
        })

        error
    end
    |> case do
      {:ok, previous_results} ->
        broadcast(channel, %LogEntry{
          name: :start_file_replication,
          severity: :ok,
          timestamp: DateTime.utc_now(),
          msg: "Starting file replication."
        })

        {:ok, file_results} = FileReplication.start(parameters, publication_name, channel)

        broadcast(channel, %LogEntry{
          name: :file_replication_finished,
          severity: :ok,
          timestamp: DateTime.utc_now(),
          msg: "File replication has finished."
        })

        {:ok, Map.put(previous_results, :file_results, file_results)}

      error ->
        error
    end
    |> case do
      {:ok, previous_results} ->
        broadcast(channel, %LogEntry{
          name: :publication_configuration_recreated,
          severity: :ok,
          timestamp: DateTime.utc_now(),
          msg: "Creating publication metadata."
        })

        {:ok, result} = MetadataGeneration.create(parameters, publication_name)

        broadcast(channel, %LogEntry{
          name: :publication_configuration_recreated,
          severity: :ok,
          timestamp: DateTime.utc_now(),
          msg: "Publication metadata created."
        })

        {:ok, Map.put(previous_results, :project_configuration_recreation, result)}
      error ->
        error
    end
    |> then(fn result_or_error ->
      broadcast(channel, {:result, result_or_error})
    end)
  end

  defp delete_existing_publication(name, channel) do
    replication_stop =
      CouchReplication.stop_replication(name)
      |> case do
        {:ok, :deleted} = result ->
          broadcast(channel, %LogEntry{
            name: :started,
            severity: :ok,
            timestamp: DateTime.utc_now(),
            msg: "Removed existing replication document for '#{name}'."
          })

          result

        result ->
          result
      end

    publication_deletion =
      CouchService.delete_database(name)
      |> case do
        {:ok, %{status: 200}} ->
          broadcast(channel, %LogEntry{
            name: :started,
            severity: :ok,
            timestamp: DateTime.utc_now(),
            msg: "Removed existing publication database for '#{name}'."
          })

          {:ok, :deleted}

        {:ok, %{status: 404}} ->
          {:ok, :already_deleted}
      end

    file_deletion =
      FileService.delete_publication(name)
      |> case do
        {:ok, []} ->
          {:ok, :already_deleted}

        {:ok, _list_of_deleted_files} ->
          broadcast(channel, %LogEntry{
            name: :started,
            severity: :ok,
            timestamp: DateTime.utc_now(),
            msg: "Removed existing publication files for '#{name}'."
          })

          {:ok, :deleted}
      end

    {replication_stop, publication_deletion, file_deletion}
  end

  def broadcast(channel, %LogEntry{severity: severity, msg: msg} = log_entry) do
    case severity do
      :error ->
        Logger.error(msg)

      _ ->
        Logger.debug(msg)
    end

    PubSub.broadcast(FieldPublication.PubSub, channel, {:replication_log, log_entry})
  end

  def broadcast(channel, {:result, result}) do
    PubSub.broadcast(FieldPublication.PubSub, channel, {:replication_result, result})
  end

  defp generate_publication_name(project_name) do
    "#{project_name}_publication_#{Date.utc_today()}"
  end
end
