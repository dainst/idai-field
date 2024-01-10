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

  def stop(%Publication{} = publication) do
    GenServer.call(__MODULE__, {:stop, publication})
  end

  def handle_call(
        {:start, %ReplicationInput{} = input, %Publication{} = publication},
        _from,
        running_replications
      ) do
    publication_id = Publications.get_doc_id(publication)

    if publication_id in running_replications do
      {:reply, :already_running, running_replications}
    else
      parameters = %{
        input: input,
        publication: publication,
        id: publication_id
      }

      log(
        parameters,
        :info,
        "Starting replication for #{publication_id} by first replicating the database."
      )

      task =
        Task.Supervisor.async_nolink(
          FieldPublication.TaskSupervisor,
          CouchReplication,
          :start,
          [parameters]
        )

      {:reply, :ok, Map.put(running_replications, publication_id, {task, parameters})}
    end
  end

  def handle_call({:stop, %Publication{} = publication}, _from, running_replications) do
    publication_id = Publications.get_doc_id(publication)

    case Map.get(running_replications, publication_id) do
      nil ->
        {:reply, :not_found}

      {task, _state} ->
        Process.exit(task.pid, :stopped)

        # Delete the replication document for this publication database in case the couch replication got killed by the exit command above.
        CouchReplication.stop_replication(publication.database)

        # Get the latest document revision (in case the publication passed as a parameter is not matching the
        # latest one), and use it to delete all data.
        Publications.get!(publication.project_name, publication.draft_date)
        |> Publications.delete()

        PubSub.broadcast(
          FieldPublication.PubSub,
          publication_id,
          {:replication_stopped}
        )

        {:reply, :stopped, running_replications}
    end
  end

  # Handle result of CouchReplication task, start file replication next.
  def handle_info({_ref, {:ok, {publication_id, :couch_replication}}}, running_replications) do
    {_finished_task, parameters} = Map.get(running_replications, publication_id)

    log(parameters, :info, "Replicating files for #{publication_id}.")

    task =
      Task.Supervisor.async_nolink(
        FieldPublication.TaskSupervisor,
        FileReplication,
        :start,
        [parameters]
      )

    {:noreply, Map.put(running_replications, publication_id, {task, parameters})}
  end

  # Handle result of FileReplication task, finish up by reconstructing the project configuration.
  def handle_info({_ref, {:ok, {publication_id, :file_replication}}}, running_replications) do
    {_finished_task, %{publication: publication} = parameters} =
      Map.get(running_replications, publication_id)

    {:ok, %{status: 201}} = reconstruct_project_configuraton(publication)

    {:ok, final_publication} =
      publication
      |> Publications.get!()
      |> Publications.put(%{"replication_finished" => DateTime.utc_now()})

    PubSub.broadcast(
      FieldPublication.PubSub,
      publication_id,
      {:replication_result, final_publication}
    )

    log(parameters, :info, "Replication finished.")

    {:noreply, Map.delete(running_replications, publication_id)}
  end

  def handle_info({:DOWN, ref, :process, _pid, :normal}, running_replications) do
    Logger.debug("A replication task has completed successfully.")

    {:noreply, cleanup(ref, running_replications)}
  end

  def handle_info({:DOWN, ref, :process, _pid, :stopped}, running_replications) do
    Logger.debug("A replication task has been stopped by a user.")

    {:noreply, cleanup(ref, running_replications)}
  end

  def handle_info({:DOWN, ref, :process, _pid, reason}, running_replications) do
    Logger.error("A replication task failed irregularly.")
    Logger.error(reason)

    {:noreply, cleanup(ref, running_replications)}
  end

  def log(%{publication: %Publication{} = publication, id: publication_id}, severity, msg) do
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

    PubSub.broadcast(FieldPublication.PubSub, publication_id, {:replication_log, log_entry})
  end

  defp reconstruct_project_configuraton(%Publication{
         database: database_name,
         configuration_doc: configuration_doc_name
       }) do
    configuration_doc =
      configuration_doc_name
      |> CouchService.get_document()
      |> then(fn {:ok, %{body: body}} ->
        Jason.decode!(body)
      end)

    full_config =
      System.cmd(
        "node",
        [
          Application.app_dir(
            :field_publication,
            "priv/publication_enricher/dist/createFullConfiguration.js"
          ),
          database_name,
          Application.get_env(:field_publication, :couchdb_url),
          Application.get_env(:field_publication, :couchdb_admin_name),
          Application.get_env(:field_publication, :couchdb_admin_password)
        ]
      )
      |> then(fn {full_configuration, 0} ->
        Map.put(configuration_doc, :config, Jason.decode!(full_configuration))
      end)

    CouchService.put_document(configuration_doc_name, full_config)
  end

  defp cleanup(ref, running_replications) do
    Map.reject(running_replications, fn {_publication_id, {task, _replication_state} = _value} ->
      task.ref == ref
    end)
  end
end
