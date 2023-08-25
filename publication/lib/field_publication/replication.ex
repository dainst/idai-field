defmodule FieldPublication.Replication do
  alias Phoenix.PubSub

  alias FieldPublication.{
    CouchService,
    FileService,
    Replication.Parameters
  }

  require Logger

  def start(%Parameters{} = params, broadcast_channel) do

    Task.Supervisor.start_child(FieldPublication.Replication.Supervisor, fn() ->
      replicate(params, broadcast_channel)
    end)
  end

  defp replicate(%Parameters{
      source_url: source_url,
      source_project_name: source_project_name,
      source_user: source_user,
      source_password: source_password,
      local_project_name: project_name
    }, broadcast_channel) do

    publication_name = "#{project_name}_publication_#{Date.utc_today()}"

    Logger.info("Starting replication for #{project_name} as #{publication_name}.")

    PubSub.broadcast(FieldPublication.PubSub, broadcast_channel, {:replication_update, {:started, DateTime.utc_now()}})

    couch_result =
      CouchService.replicate(
            "#{source_url}/db/#{source_project_name}",
            source_user,
            source_password,
            publication_name
      )
      |> case do
        {:ok, %Finch.Response{status: 200}} ->
          PubSub.broadcast(
            FieldPublication.PubSub,
            broadcast_channel,
            {:replication_update, {:database_replication_finished, DateTime.utc_now()}})
          {:ok, :database_replicated}
        {:ok, %Finch.Response{status: 500}} ->
          error = :database_replication_error

          PubSub.broadcast(
            FieldPublication.PubSub,
            broadcast_channel,
            {:replication_error, {error, DateTime.utc_now()}}
          )

          {:error, error}
      end

    file_result =
      FileService.replicate(
        "#{source_url}/files/#{source_project_name}",
        source_user,
        source_password,
        publication_name
      )
      |> case do
        {:ok, file_response} ->
          msg = :file_replication_finished
          PubSub.broadcast(
            FieldPublication.PubSub,
            broadcast_channel,
            {:replication_update, {msg, DateTime.utc_now()}})
          {:ok, file_response}
        {:error, :unauthorized} ->
          error = :file_replication_unauthorized
          PubSub.broadcast(
            FieldPublication.PubSub,
            broadcast_channel,
            {:replication_update, {error, DateTime.utc_now()}})
          {:error, error}
        {:error, :not_found} ->
          error = :file_replication_not_found
          PubSub.broadcast(
            FieldPublication.PubSub,
            broadcast_channel,
            {:replication_update, {error, DateTime.utc_now()}})
          {:error, error}
      end

    {:ok, _} = create_publication_metadata(project_name, publication_name)

    PubSub.broadcast(
      FieldPublication.PubSub,
      broadcast_channel,
      {:replication_update, {:publication_metadata_created, DateTime.utc_now()}})

      %{
        couch_result: couch_result,
        file_result: file_result,
        name: publication_name
      }
  end

  defp create_publication_metadata(project_name, publication_name) do

    url = Application.get_env(:field_publication, :couchdb_url)

    {:ok, full_config} = create_full_configuration(url, publication_name)

    metadata = %{
      publication_name => %{
        date: DateTime.to_iso8601(DateTime.now!("Etc/UTC")),
        configuration: full_config
      }
    }

    CouchService.retrieve_document(project_name)
    |> case do
      {:ok, %Finch.Response{status: 404}} ->
        CouchService.store_document(project_name, metadata)
      {:ok, %Finch.Response{body: body, status: 200}} ->
        updated =
          body
          |> Jason.decode!()
          |> then(fn(existing) ->
            existing
            |> Map.merge(metadata)
          end)

        CouchService.store_document(project_name, updated)
    end
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
end
