defmodule FieldPublication.Replication.CouchReplication do

  @fix_source_url Application.compile_env(:field_publication, :development_mode, false)
  @poll_frequency 1000

  alias Phoenix.PubSub

  alias FieldPublication.{
    CouchService,
    Replication.LogEntry,
    Replication.Parameters
  }

  require Logger

  def start(%Parameters{} = parameters, publication_name, channel) do

    # The replication document will get added to CouchDB's internal database '_replicator' in order to trigger the replication.
    replication_doc = create_replication_doc(parameters, publication_name)

    with {:ok, source_doc_count} <- source_doc_count(parameters, channel),
      {:ok, %{status: 201}} <- put_replication_doc(publication_name, replication_doc) do
        # Once the document has been committed, poll the progress in regular intervals.
        poll_replication_status(parameters, publication_name, source_doc_count, channel)
    else
      {:error, :error_count_exceeded} ->
        CouchService.delete_document(publication_name, "_replicator")
        # TODO: delete publication db
        {:error, :couchdb_error_count_exceeded}
      error ->
        error
    end
  end

  defp create_replication_doc(
    %Parameters{source_url: source_url, source_project_name: source_project_name, source_user: source_user, source_password: source_password},
    publication_name
  ) do
    %{
      _id: publication_name,
      create_target: true,
      winning_revs_only: true,
      source: %{
        # This URL is relative to the CouchDB application context, which is not necessarily the same as FieldPublication's.
        url: "#{source_url}/db/#{source_project_name}" |> source_url_fix(),
        headers: CouchService.headers(source_user, source_password) |> Enum.into(%{})
      },
      target: %{
        # This URL is relative to the CouchDB application context, which is not necessarily the same as FieldPublication's.
        url: "http://127.0.0.1:5984/#{publication_name}",
        headers: CouchService.headers() |> Enum.into(%{})
      }
    }
  end

  def stop_replication(name) do
    doc =
      CouchService.retrieve_document(name, "_replicator")
      |> then(fn({:ok, %{body: body}}) ->
        body
      end)
      |> Jason.decode!()

    case doc do
      %{"error" => "not_found", "reason" => "deleted"} ->
        {:ok, :already_deleted}
      doc ->
        {:ok, %{status: 200}} = CouchService.delete_document(doc, "_replicator")

        {:ok, :deleted}
    end
  end

  defp put_replication_doc(name, replication_doc) do
    CouchService.store_document(name, replication_doc, "_replicator")
    |> case do
      {:ok, %{status: 409}} ->
        # If another replication doc of the same name is encountered, the function will replace
        # the old document with the new one without asking.
        stop_replication(name)
        CouchService.store_document(name, replication_doc, "_replicator")

      {:ok, %{status: 201}} = result ->
        result
    end
  end

  defp poll_replication_status(parameters, name, source_doc_count, channel) do

    CouchService.retrieve_document(name, "/_scheduler/docs/_replicator")
    |> case do
      {:ok, %{status: 200, body: body}} ->
        body
        |> Jason.decode!()
        |> case do
          %{"state" => "running", "info" => %{"docs_written" => docs_written}} ->
            PubSub.broadcast(FieldPublication.PubSub, channel, {:document_processing, %{counter: docs_written, overall: source_doc_count}})
            Process.sleep(@poll_frequency)
            poll_replication_status(parameters, name, source_doc_count, channel)

          %{"state" => state} when  state == nil or state == "initializing" or state == "running" ->
            # Different cases shortly after the replication document has been committed.
            Process.sleep(@poll_frequency)
            poll_replication_status(parameters, name, source_doc_count, channel)

          %{"state" => "completed"} ->
            PubSub.broadcast(FieldPublication.PubSub, channel, {:document_processing, %{counter: source_doc_count, overall: source_doc_count}})
            {:ok, :completed}

          %{"state" => "crashing", "info" => %{"error" => _message}} = error ->
            PubSub.broadcast(FieldPublication.PubSub, channel, {:replication_log, %LogEntry{
              name: :document_replication_crashed,
              severity: :error,
              timestamp: DateTime.utc_now(),
              msg: "Experienced error while replicating documents, stopping replication."
            }})

            Logger.error(error)

            {:error, :couchdb_replication_error}
        end
    end
  end

  defp source_doc_count(%Parameters{source_url: url, source_project_name: project_name, source_user: user, source_password: password}, channel) do
    Finch.build(
      :get,
      "#{url}/db/#{project_name}",
      CouchService.headers(user, password)
    )
    |> Finch.request(FieldPublication.Finch)
    |> case do
      {:ok, %{status: 200, body: body}} ->
        {_, count } = result =
          body
          |> Jason.decode!()
          |> case do
            %{"doc_count" => count, "doc_del_count" => del_count} ->
              {:ok, count + del_count} # This handles a CouchDB as source
            %{"update_seq" => update_seq} when is_number(update_seq) ->
              {:ok, update_seq} # this handles a PouchDB as source
          end

        PubSub.broadcast(FieldPublication.PubSub, channel, {:replication_log, %LogEntry{
          name: :document_count,
          severity: :ok,
          timestamp: DateTime.utc_now(),
          msg: "#{count} database documents need replication."
        }})

        result
      {:ok, %{status: 401}} ->
        {:error, :unauthorized}
      {:error, %Mint.TransportError{} = reason} ->
        {:error, reason}
      # TODO: Handle other results
    end
  end

  @dialyzer {:nowarn_function, source_url_fix: 1}
  defp source_url_fix(url) do
    # If we want to connect to FieldHub running at localhost:4000 in development
    # we have to use host.docker.internal as url for the FieldPublication CouchDB. This is
    # necessary because calling localhost within the container would otherwise resolve to the container itself.

    if @fix_source_url do
      String.replace(url, "localhost", "host.docker.internal")
    else
      url
    end
  end
end
