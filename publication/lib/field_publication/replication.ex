defmodule FieldPublication.Replication do
  use GenServer

  alias Phoenix.PubSub

  alias FieldPublication.{
    CouchService,
    Replication.CouchReplication,
    Replication.FileReplication,
    Processing,
    Publications
  }

  alias FieldPublication.DatabaseSchema.{
    ReplicationInput,
    Publication,
    LogEntry
  }

  require Logger

  @moduledoc """
  This GenServer is used to start, stop and track data replications.

  GenServers are a core building block in Elixir (or rather the whole Erlang ecosystem).
  Basically this defines a child process that gets started when the application is started
  (see application.ex) and waits for requests from other processes within the system.
  It holds an internal state (a map tracking current replications) and provides some API functions
  that let other part of the application start/stop or monitor the running replications.

  See also https://hexdocs.pm/elixir/1.15.7/GenServer.htm

  - Each key in the state map is the publication id, see
    `FieldPublication.Publications.get_doc_id/1`.
  - Each value in the state map then contains a tuple `{task_id, replication_parameters}`. The
    `task_id` references a currently running async task process. The `replication_parameters`
    contain the initial `ReplicationInput` provided by the user and the current version of the
    `Publication` document.

  This publication's ID is also used to broadcast PubSub messages throughout the application.

  Use the API functions below to interact with the module.
  """

  def start_link(_opts) do
    Logger.debug("Starting Replication GenServer")
    GenServer.start_link(__MODULE__, [], name: __MODULE__)
  end

  def init(_) do
    Logger.debug("Initializing Replication GenServer state to empty map")

    {:ok, %{}}
  end

  #########################################################################
  ## Start of API functions to be called from the rest of the application.

  def initialize_publication(%ReplicationInput{} = params) do
    with {:ok, publication} <- Publications.create_from_replication_input(params),
         {:ok, :connection_successful} <- check_source_connection(params) do
      {:ok, publication}
    else
      {:error, %{errors: [duplicate_document: {msg, _}]}} ->
        {:error, msg}

      {:error, %{errors: [database_exists: {msg, _}]}} ->
        {:error, msg}

      error ->
        error
    end
  end

  defp check_source_connection(
         %ReplicationInput{
           source_url: url,
           source_project_name: project_name,
           source_user: user,
           source_password: password
         } = input
       ) do
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

      {:error, %Mint.TransportError{reason: reason}} ->
        # Unable to establish any connection. Create an appropriate changeset for displaying error messages.
        ReplicationInput.get_connection_error_changeset(input, reason)

      {:ok, %{status: status}} ->
        # Connection was established, but recieved error status code. Create an appropriate changeset for displaying error messages.
        ReplicationInput.get_connection_error_changeset(input, status)
    end
  end

  def start(%ReplicationInput{} = input, %Publication{} = publication) do
    GenServer.call(__MODULE__, {:start, input, publication})
  end

  def stop(%Publication{} = publication) do
    GenServer.call(__MODULE__, {:stop, publication})
  end

  def show(%Publication{} = publication) do
    GenServer.call(__MODULE__, {:show, publication})
  end

  # End of API function definitions. Everything below should __not__ get called directly from
  # other modules.
  ###################################

  @doc """
  These `handle_call/3` implementations handle messages sent by other processes to
  the GenServer. These calls will in general originate from the API functions defined above or
  from the asynchronous tasks started by the GenServer itself (reporting that the replication
  task has finished/crashed...).
  """
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

      task =
        Task.Supervisor.async_nolink(FieldPublication.TaskSupervisor, fn ->
          persisted_log(publication, :info, "Replicating database for #{publication_id}.")
          CouchReplication.start(parameters)

          persisted_log(publication, :info, "Replicating files for #{publication_id}.")
          FileReplication.start(parameters)

          persisted_log(
            publication,
            :info,
            "Reconstructing project configuration for '#{publication_id}'."
          )

          reconstruct_project_configuraton(publication)

          languages =
            CouchService.get_document("configuration", publication.database)
            |> case do
              {:ok, %{status: 200, body: body}} ->
                body
                |> Jason.decode!()
                |> Map.get("resource", %{})
                |> Map.get("projectLanguages", [])

              _ ->
                # Projects created before Field Desktop 3 do not have a
                # configuration document.
                []
            end

          persisted_log(publication, :info, "Draft creation finished.")

          {:ok, %Publication{} = final_publication} =
            Publications.get!(publication.project_name, publication.draft_date)
            |> Publications.put(%{
              "replication_finished" => DateTime.utc_now(),
              "languages" => languages
            })

          {:ok, {:draft_created, final_publication}}
        end)

      {:reply, :ok, Map.put(running_replications, publication_id, {task, parameters})}
    end
  end

  def handle_call({:stop, %Publication{} = publication}, _from, running_replications) do
    publication_id = Publications.get_doc_id(publication)

    case Map.get(running_replications, publication_id) do
      nil ->
        {:reply, :not_found, running_replications}

      {task, _parameters} ->
        Process.exit(task.pid, :stopped)

        # Delete the replication document for this publication database in case the couch replication got killed by the exit command above.
        CouchReplication.stop_replication(publication.database)

        {:reply, :stopped, running_replications}
    end
  end

  def handle_call({:show, %Publication{} = publication}, _from, running_replications) do
    publication_id = Publications.get_doc_id(publication)

    case Map.get(running_replications, publication_id) do
      nil ->
        {:reply, nil, running_replications}

      {task, parameters} ->
        {:reply, %{task: task, parameters: parameters}, running_replications}
    end
  end

  def handle_info(
        {_ref, {:ok, {:draft_created, publication}}},
        running_replications
      ) do
    # Handles the success result of the async process started in `start/2` above. We check
    # if the input requested immediate processing and otherwise let the process stop, which will
    # get picked up in the handle_info/2 below that checks for the :DOWN atom.
    publication_id = Publications.get_doc_id(publication)

    {_finished_task, %{input: %{processing: start_processing_immediately}}} =
      Map.get(running_replications, publication_id)

    if start_processing_immediately do
      # Processing is a separate GenServer, so we just hand over the publication and
      # otherwise let the replication process finish.
      Processing.start(publication)
    end

    {:noreply, running_replications}
  end

  def handle_info({:DOWN, ref, :process, _pid, return_value}, running_replications) do
    [{publication_id, {_task, %{publication: publication} = _parameters}}] =
      Enum.filter(running_replications, fn {_publication_id, {task, _parameters} = _value} ->
        task.ref == ref
      end)

    case return_value do
      :normal ->
        Logger.debug("A replication task has completed successfully.")

      :stopped ->
        persisted_log(publication, :warning, "Replication stopped by the user.")

      other ->
        msg = "The replication task '#{publication_id}' failed irregularly:"

        persisted_log(publication, :error, "#{msg} #{inspect(other)}")
    end

    PubSub.broadcast(
      FieldPublication.PubSub,
      publication_id,
      {:replication_stopped}
    )

    {:noreply, cleanup(ref, running_replications)}
  end

  @doc """
  Logs the message to the console and writes it to the publication document with the requested severity level.
  """
  def persisted_log(%Publication{} = publication, severity, message)
      when severity in [:error, :warning, :info, :debug] and is_binary(message) do
    case severity do
      :error ->
        Logger.error(message)

      :warning ->
        Logger.warning(message)

      :info ->
        Logger.info(message)

      _ ->
        Logger.debug(message)
    end

    {:ok, log_entry} =
      LogEntry.create(%{
        severity: severity,
        timestamp: DateTime.utc_now(),
        message: message,
        key: :replication_step
      })

    Publications.get!(publication.project_name, publication.draft_date)
    |> Map.update(:replication_logs, [], fn existing -> existing ++ [log_entry] end)
    |> Publications.put(%{})
  end

  def reconstruct_project_configuraton(%Publication{
        source_project_name: source_project_name,
        database: database_name,
        configuration_doc: configuration_doc_name
      }) do
    {_logged_output, 0} =
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
          Application.get_env(:field_publication, :couchdb_admin_password),
          source_project_name,
          CouchService.get_document_url(configuration_doc_name)
        ]
      )

    :ok
  end

  defp cleanup(ref, running_replications) do
    # Removes a replication task by reference from the list of active replications.
    Map.reject(running_replications, fn {_publication_id, {task, _replication_state} = _value} ->
      task.ref == ref
    end)
  end
end
