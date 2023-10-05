defmodule FieldPublication.Replication.FileReplication do
  alias Phoenix.PubSub
  alias FieldPublication.FileService
  alias FieldPublication.Replication

  alias FieldPublication.Schemas.{
    ReplicationInput,
    Publication
  }

  require Logger

  @file_variants_to_replicate Application.compile_env(
                                :field_publication,
                                :file_variants_to_replicate
                              )

  def start(
        %{
          parameters: %ReplicationInput{
            source_url: source_url,
            source_project_name: source_project_name,
            source_user: source_user,
            source_password: source_password,
            project_name: project_key
          },
          publication: %Publication{
            draft_date: draft_date
          }
        } = state
      ) do
    headers = [
      {"Content-Type", "application/json"},
      {"Authorization", "Basic #{"#{source_user}:#{source_password}" |> Base.encode64()}"}
    ]

    base_file_url = "#{source_url}/files/#{source_project_name}"

    file_lists_by_variant =
      @file_variants_to_replicate
      |> Stream.map(&get_file_list(&1, base_file_url, headers))
      |> Enum.map(fn {variant, result} ->
        # Reject all files, that are already present in file system
        filtered =
          result
          |> Enum.reject(fn {uuid, _} ->
            FileService.file_exists?(project_key, draft_date, uuid)
          end)

        {variant, filtered}
      end)

    overall_file_count =
      file_lists_by_variant
      |> Stream.map(fn {_variant, map} ->
        Enum.count(map)
      end)
      |> Enum.reduce(fn val, sum ->
        sum + val
      end)

    {:ok, counter_pid} =
      Agent.start_link(fn -> %{overall: overall_file_count, counter: 0} end)

    Replication.log(state, :info, "#{overall_file_count} files need replication.")

    file_processing_parameters = {counter_pid, state}

    file_lists_by_variant
    |> Enum.map(&copy_files(&1, base_file_url, headers, file_processing_parameters))

    {:ok, :successful}
  end

  defp get_file_list(file_variant, base_url, headers) do
    Finch.build(
      :get,
      "#{base_url}?types[]=#{file_variant}",
      headers
    )
    |> Finch.request(FieldPublication.Finch)
    |> case do
      {:ok, %Finch.Response{body: body, status: 200}} ->
        result =
          body
          |> Jason.decode!()
          |> Enum.reject(fn {_key, %{"deleted" => deleted}} ->
            deleted
          end)

        {file_variant, result}

      {:ok, %Finch.Response{status: 401}} ->
        {:error, :unauthorized}

      {:ok, %Finch.Response{status: 404}} ->
        {:error, :not_found}
    end
  end

  defp copy_files(
         {variant, file_list},
         base_file_url,
         headers,
         parameters
       ) do
    file_list
    |> Stream.chunk_every(100)
    |> Enum.map(fn chunk ->
      chunk
      |> Stream.map(
        &Task.async(fn ->
          copy_file(&1, variant, base_file_url, headers, parameters)
        end)
      )
      |> Enum.map(&Task.await(&1, 30000))
    end)
  end

  defp copy_file(
         {uuid, _metadata},
         variant,
         base_url,
         headers,
         {
           counter_pid,
           %{
             channel: channel,
             publication: %{project_name: project_key, draft_date: draft_date} = _state
           }
         }
       ) do
    Finch.build(
      :get,
      "#{base_url}/#{uuid}?type=#{variant}",
      headers
    )
    |> Finch.request(FieldPublication.Finch)
    |> case do
      {:ok, %Finch.Response{status: 200, body: data}} ->
        FileService.write_file(project_key, draft_date, uuid, data)
    end

    Agent.update(counter_pid, fn state -> Map.put(state, :counter, state[:counter] + 1) end)

    PubSub.broadcast(
      FieldPublication.PubSub,
      channel,
      {
        :file_processing,
        Agent.get(counter_pid, fn state -> state end)
      }
    )
  end
end
