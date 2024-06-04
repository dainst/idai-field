defmodule FieldPublication.Replication do
  use GenServer

  require Logger

  alias FieldPublication.Processing
  alias FieldPublication.Publications.Data
  alias Phoenix.PubSub

  alias FieldPublication.{
    CouchService,
    Replication.CouchReplication,
    Replication.FileReplication,
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

    {:ok, %{}}
  end

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
          start(parameters)
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

  def handle_call({:show, %Publication{} = publication}, _from, running_replications) do
    publication_id = Publications.get_doc_id(publication)

    case Map.get(running_replications, publication_id) do
      nil ->
        {:reply, :not_found, running_replications}

      {task, parameters} ->
        {:reply, %{task: task, parameters: parameters}, running_replications}
    end
  end

  defp start(
         %{
           publication: %Publication{} = publication,
           id: publication_id
         } = parameters
       ) do
    log(
      parameters,
      :info,
      "Starting replication for #{publication_id} by first replicating the database."
    )

    CouchReplication.start(parameters)

    log(parameters, :info, "Replicating files for #{publication_id}.")

    FileReplication.start(parameters)

    {:ok, %{status: 201}} = reconstruct_project_configuraton(publication)

    create_hierarchy_doc(publication)

    # The reconstructed project configuration does not retain a simple list of the languages used for the
    # publication. We read that information from the "configuration" document (pre-reconstruction) and save it
    # in our `Publication` document as a shorthand.
    language_default = ["en"]

    languages =
      CouchService.get_document("configuration", publication.database)
      |> case do
        {:ok, %{status: 200, body: body}} ->
          body
          |> Jason.decode!()
          |> Map.get("resource", %{})
          |> Map.get("projectLanguages", language_default)

        _ ->
          language_default
      end

    {:ok, final_publication} =
      publication
      |> Publications.get!()
      |> Publications.put(%{
        "replication_finished" => DateTime.utc_now(),
        "languages" => languages
      })

    {:ok, {publication_id, final_publication, :replication_done}}
  end

  def handle_info(
        {_ref, {:ok, {publication_id, final_publication, :replication_done}}},
        running_replications
      ) do
    {_finished_task,
     %{
       input: %{processing: start_processing_immediately}
     } = parameters} =
      Map.get(running_replications, publication_id)

    log(parameters, :info, "Replication finished.")

    if start_processing_immediately do
      Processing.start(final_publication)
    end

    PubSub.broadcast(
      FieldPublication.PubSub,
      publication_id,
      {:replication_result, final_publication}
    )

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

    [{publication_id, {_task, parameters}}] =
      Enum.filter(running_replications, fn {_publication_id, {task, _replication_state} = _value} ->
        task.ref == ref
      end)

    log(parameters, :error, inspect(reason))

    PubSub.broadcast(
      FieldPublication.PubSub,
      publication_id,
      {:replication_stopped}
    )

    Publications.delete(parameters.publication)

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

  defp create_hierarchy_doc(%Publication{} = publication) do
    hierarchy_mapping =
      publication
      |> Data.get_doc_stream_for_all()
      |> Enum.reduce(%{}, fn doc, acc ->
        uuid = doc["_id"]

        {_key, [parent_uuid]} =
          Enum.find(doc["resource"]["relations"], nil, fn {key, _val} ->
            key == "liesWithin"
          end)
          |> case do
            nil ->
              Enum.find(doc["resource"]["relations"], {nil, [nil]}, fn {key, _val} ->
                key == "isRecordedIn"
              end)

            val ->
              val
          end

        # Update or initialize self
        acc =
          Map.update(acc, doc["_id"], %{children: [], parent: parent_uuid}, fn existing ->
            Map.put(existing, :parent, parent_uuid)
          end)

        # Update or initialize the parent
        if parent_uuid != nil do
          Map.update(
            acc,
            parent_uuid,
            %{children: [uuid], parent: nil},
            fn %{
                 children: existing_children
               } = existing ->
              Map.put(existing, :children, existing_children ++ [uuid])
            end
          )
        else
          acc
        end
      end)
      |> Enum.reject(fn {_key, value} ->
        value[:parent] == nil and value[:children] == []
      end)
      |> Enum.into(%{})

    document_content =
      CouchService.get_document(publication.hierarchy_doc)
      |> case do
        {:ok, %{status: 200, body: body}} ->
          doc = Jason.decode!(body)
          Map.put(doc, "_rev", doc["_rev"])
          Map.put(doc, "hierarchy", hierarchy_mapping)

        _ ->
          %{"hierarchy" => hierarchy_mapping}
      end

    CouchService.put_document(publication.hierarchy_doc, document_content)
  end

  defp cleanup(ref, running_replications) do
    Map.reject(running_replications, fn {_publication_id, {task, _replication_state} = _value} ->
      task.ref == ref
    end)
  end
end
