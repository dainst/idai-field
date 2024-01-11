defmodule FieldPublication.Replication.CouchReplication do
  @fix_source_url Application.compile_env(:field_publication, :dev_routes)
  @poll_frequency 1000

  alias Phoenix.PubSub

  alias FieldPublication.{
    CouchService,
    Replication
  }

  alias FieldPublication.Schemas.ReplicationInput

  require Logger

  def start(%{input: input, publication: %{database: target_database_name}} = parameters) do
    # The replication document will get added to CouchDB's internal database '_replicator' in order to trigger the replication.
    replication_doc =
      create_replication_doc(
        input,
        target_database_name
      )

    with {:ok, source_doc_count} <- source_doc_count(input, parameters),
         {:ok, %{status: 201}} <- put_replication_doc(target_database_name, replication_doc) do
      # Once the document has been committed, poll the progress in regular intervals.
      poll_replication_status(target_database_name, source_doc_count, parameters)
    else
      {:error, :error_count_exceeded} ->
        CouchService.delete_document(target_database_name, "_replicator")
        CouchService.delete_database(target_database_name)
        {:error, :couchdb_error_count_exceeded}

      error ->
        error
    end
  end

  defp create_replication_doc(
         %ReplicationInput{
           source_url: source_url,
           source_project_name: source_project_name,
           source_user: source_user,
           source_password: source_password
         },
         target_database
       ) do
    %{
      _id: target_database,
      winning_revs_only: true,
      source: %{
        # This URL is relative to the CouchDB application context, which is not necessarily the same as FieldPublication's.
        url: "#{source_url}/db/#{source_project_name}" |> source_url_fix(),
        headers: CouchService.headers(source_user, source_password) |> Enum.into(%{})
      },
      target: %{
        # This URL is relative to the CouchDB application context, which is not necessarily the same as FieldPublication's.
        url: "http://127.0.0.1:5984/#{target_database}",
        headers: CouchService.headers() |> Enum.into(%{})
      }
    }
  end

  def get_replication_doc(database_name) do
    database_name
    |> CouchService.get_document("_replicator")
    |> then(fn {:ok, %{body: body}} ->
      body
    end)
    |> Jason.decode!()
    |> case do
      %{"error" => "not_found"} ->
        {:error, :not_found}

      doc ->
        {:ok, doc}
    end
  end

  def stop_replication(database_name) do
    database_name
    |> get_replication_doc()
    |> case do
      {:error, :not_found} ->
        {:ok, :not_found}

      {:ok, %{"_id" => id, "_rev" => rev}} ->
        {:ok, %{status: 200}} = CouchService.delete_document(id, rev, "_replicator")

        {:ok, :deleted}
    end
  end

  defp put_replication_doc(database_name, replication_doc) do
    database_name
    |> CouchService.put_document(replication_doc, "_replicator")
    |> case do
      {:ok, %{status: 409}} ->
        # If another replication doc of the same name is encountered, the function will replace
        # the old document with the new one without asking.
        stop_replication(database_name)
        CouchService.put_document(database_name, replication_doc, "_replicator")

      {:ok, %{status: 201}} = result ->
        result
    end
  end

  defp poll_replication_status(database_name, source_doc_count, %{id: id} = parameters) do
    CouchService.get_document(database_name, "/_scheduler/docs/_replicator")
    |> case do
      {:ok, %{status: 200, body: body}} ->
        body
        |> Jason.decode!()
        |> case do
          %{"state" => "running", "info" => %{"docs_written" => docs_written}} ->
            PubSub.broadcast(
              FieldPublication.PubSub,
              id,
              {:document_replication_count, %{counter: docs_written, overall: source_doc_count}}
            )

            Process.sleep(@poll_frequency)
            poll_replication_status(database_name, source_doc_count, parameters)

          %{"state" => couch_state}
          when couch_state == nil or couch_state == "initializing" or couch_state == "running" ->
            # Different cases shortly after the replication document has been committed.
            Process.sleep(@poll_frequency)
            poll_replication_status(database_name, source_doc_count, parameters)

          %{"state" => "completed"} ->
            PubSub.broadcast(
              FieldPublication.PubSub,
              id,
              {:document_replication_count,
               %{counter: source_doc_count, overall: source_doc_count}}
            )

            Replication.log(
              parameters,
              :info,
              "Transforming legacy data..."
            )

            %{ok: _successes, errors: errors} = transform_legacy_data(database_name)

            Enum.map(errors, fn error ->
              Replication.log(
                parameters,
                :error,
                error
              )
            end)

            {:ok, {id, :couch_replication}}

          %{"state" => "crashing", "info" => %{"error" => _message}} = error ->
            Logger.error(error)

            Replication.log(
              parameters,
              :error,
              "Experienced error while replicating documents, stopping replication."
            )

            {:error, {id, error}}
        end
    end
  end

  defp source_doc_count(
         %ReplicationInput{
           source_url: url,
           source_project_name: project_name,
           source_user: user,
           source_password: password
         },
         state
       ) do
    Finch.build(
      :get,
      "#{url}/db/#{project_name}",
      CouchService.headers(user, password)
    )
    |> Finch.request(FieldPublication.Finch)
    |> case do
      {:ok, %{status: 200, body: body}} ->
        {_, count} =
          result =
          body
          |> Jason.decode!()
          |> case do
            %{"doc_count" => count, "doc_del_count" => del_count} ->
              # This handles a CouchDB as source
              {:ok, count + del_count}

            %{"update_seq" => update_seq} when is_number(update_seq) ->
              # this handles a PouchDB as source
              {:ok, update_seq}
          end

        Replication.log(state, :info, "#{count} database documents need replication.")

        result

      {:ok, %{status: 401}} ->
        {:error, :unauthorized}

      {:error, %Mint.TransportError{} = reason} ->
        {:error, reason}
    end
  end

  defp transform_legacy_data(database_name) do
    CouchService.get_document_stream(%{selector: %{}}, database_name)
    |> Stream.map(&legacy_replace_type/1)
    |> Stream.map(&legacy_fix_period/1)
    |> Stream.map(&legacy_remove_attachment/1)
    |> Task.async_stream(
      # Put the documents back into the CouchDB
      fn %{"_id" => id} = doc ->
        CouchService.put_document(id, doc, database_name)
      end,
      max_concurrency: 100
    )
    |> Enum.reduce(%{ok: 0, errors: []}, fn response, acc ->
      case response do
        {:ok, {:ok, %{status: 201}}} ->
          # Document was successfully updated
          Map.put(acc, :ok, acc[:ok] + 1)

        {:ok, {:ok, %{body: body}}} ->
          # Keep the CouchDB response as error message.
          Map.put(acc, :errors, acc[:errors] ++ [body])

        val ->
          # Use inspect/1 to create string from all other arbitrary error cases.
          Map.put(acc, :errors, acc[:errors] ++ [inspect(val)])
      end
    end)
  end

  defp legacy_replace_type(%{"resource" => %{"type" => type_value} = resource} = doc) do
    updated_resource =
      resource
      |> Map.put("category", type_value)
      |> Map.delete("type")

    Map.put(doc, "resource", updated_resource)
  end

  defp legacy_replace_type(doc) do
    doc
  end

  defp legacy_fix_period(%{"resource" => %{"period" => period} = resource} = doc)
       when not is_map(period) do
    updated_period =
      if resource["periodEnd"] == nil do
        %{"value" => period}
      else
        %{"value" => period, "endValue" => resource["periodEnd"]}
      end

    updated_resource = Map.put(resource, "period", updated_period)

    Map.put(doc, "resource", updated_resource)
  end

  defp legacy_fix_period(doc) do
    doc
  end

  defp legacy_remove_attachment(%{"_attachments" => _} = doc) do
    # In older Field Desktop versions the image thumbnails were saved as attachments.
    Map.delete(doc, "_attachments")
  end

  defp legacy_remove_attachment(doc) do
    doc
  end

  @dialyzer {:nowarn_function, source_url_fix: 1}
  defp source_url_fix(url) do
    # If we want to connect to FieldHub running at localhost:4000 in development or test
    # we have to use host.docker.internal as url for the FieldPublication CouchDB. This is
    # necessary because calling localhost within the container would otherwise resolve to the container itself.

    if @fix_source_url do
      String.replace(url, "localhost", "host.docker.internal")
    else
      url
    end
  end
end
