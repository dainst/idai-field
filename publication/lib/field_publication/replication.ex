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
    Replication.Parameters
  }

  require Logger

  def start(%Parameters{local_project_name: local_project_name} = params, broadcast_channel) do
    broadcast(broadcast_channel, %LogEntry{
      name: :start,
      severity: :ok,
      timestamp: DateTime.utc_now(),
      msg: "Starting replication for #{local_project_name}."
    })

    Task.Supervisor.start_child(FieldPublication.Replication.Supervisor, fn() ->
      replicate(params, broadcast_channel)
    end)
  end

  defp replicate(%Parameters{
      local_project_name: project_name,
      local_delete_existing: delete,
      source_url: source_url,
      source_project_name: source_project_name
    } = parameters, channel) do

    publication_name = "#{project_name}_publication_#{Date.utc_today()}"

    if delete do
      {{:ok, _}, {:ok, _}, {:ok, _}} = delete_existing_publication(publication_name, channel)
    end

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

        parameters
        |> FileReplication.start(publication_name, channel)
        |> case do
          {:error, name} = error ->
            broadcast(channel, %LogEntry{
              name: name,
              severity: :error,
              timestamp: DateTime.utc_now(),
              msg: "File replication has failed."
            })

            error
          {:ok, file_results} ->
            broadcast(channel, %LogEntry{
              name: :file_replication_finished,
              severity: :ok,
              timestamp: DateTime.utc_now(),
              msg: "File replication has finished."
            })

            {:ok, Map.put(previous_results, :file_results, file_results)}
        end
      error ->
        error
    end
    |> case do
      {:ok, previous_results} ->
        create_publication_metadata(project_name, publication_name, source_url, source_project_name)
        |> case do
          {:error, name} ->
            broadcast(channel, %LogEntry{
              name: name,
              severity: :ok,
              timestamp: DateTime.utc_now(),
              msg: "Publication's project configuration recreated."
            })

          {:ok, result} ->
            broadcast(channel, %LogEntry{
              name: :publication_configuration_recreated,
              severity: :ok,
              timestamp: DateTime.utc_now(),
              msg: "Publication's project configuration recreated."
            })

            {:ok, Map.put(previous_results, :project_configuration_recreation, result)}
          end
      error ->
        error
    end
    |> then(fn(result_or_error) ->
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
      |> IO.inspect()
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

  defp create_publication_metadata(project_name, publication_name, source_url, source_project_name) do
    url = Application.get_env(:field_publication, :couchdb_url)

    {:ok, full_config} = create_full_configuration(url, publication_name)

    configuration_doc_name = "#{publication_name}-config"

    CouchService.get_document(configuration_doc_name)
    |> case do
      {:ok, %{status: 404}} ->
        CouchService.put_document(%{id: configuration_doc_name, data: full_config})
      {:ok, %{status: 200, body: body}} ->
        %{"_rev" => rev} = Jason.decode!(body)
        CouchService.delete_document(configuration_doc_name, rev)
        CouchService.put_document(%{id: configuration_doc_name, data: full_config})
    end

    Project.get_project!(project_name)
    |> Project.add_publication(
      %Publication{
        source_url: source_url,
        source_project_name: source_project_name,
        configuration_doc: configuration_doc_name,
        database: publication_name,
        draft_date: Date.utc_today()
      }
    )

    {:ok, :metadata_created}
  end

  defp create_full_configuration(url, publication_name) do
    System.cmd(
      "node",
      [
        Application.app_dir(
          :field_publication,
          "priv/publication_enricher/dist/createFullConfiguration.js"
        ),
        publication_name,
        url,
        Application.get_env(:field_publication, :couchdb_admin_name),
        Application.get_env(:field_publication, :couchdb_admin_password)
      ]
    )
    |> case do
      {full_configuration, 0} ->
        {:ok, Jason.decode!(full_configuration)}
    end
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
end
