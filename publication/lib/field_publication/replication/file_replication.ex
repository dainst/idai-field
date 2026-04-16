defmodule FieldPublication.Replication.FileReplication do
  alias FieldPublication.{
    FileService,
    Replication,
    Publications
  }

  alias FieldPublication.DatabaseSchema.{
    ReplicationInput,
    Publication
  }

  require Logger

  @field_hub_to_publication_file_mapping Application.compile_env(
                                           :field_publication,
                                           :field_hub_to_publication_file_mapping
                                         )

  def start(
        %{
          input:
            %ReplicationInput{
              source_url: source_url,
              source_project_name: source_project_name,
              source_user: source_user,
              source_password: source_password
            } = input,
          publication: %Publication{} = publication
        } = parameters
      ) do
    headers = [
      {"Content-Type", "application/json"},
      {"Authorization", "Basic #{"#{source_user}:#{source_password}" |> Base.encode64()}"}
    ]

    base_file_url = "#{source_url}/files/#{source_project_name}"

    uuid_lists_by_variant =
      @field_hub_to_publication_file_mapping
      |> Enum.map(fn {variant_name, local_variant_name} ->
        {get_file_list(variant_name, base_file_url, headers), variant_name, local_variant_name}
      end)
      |> Enum.map(fn {result, variant_name, local_variant_name} ->
        # Reject all files, that are already present in file system
        filtered =
          result
          |> Stream.map(fn {uuid, _file_metadata} ->
            uuid
          end)
          |> Enum.reject(fn uuid ->
            FileService.raw_data_file_exists?(publication.project_name, uuid, local_variant_name)
          end)

        {filtered, variant_name, local_variant_name}
      end)

    overall_file_count =
      uuid_lists_by_variant
      |> Stream.map(fn {result, _variant_name, _local_variant_name} ->
        Enum.count(result)
      end)
      |> Enum.reduce(fn val, sum ->
        sum + val
      end)

    {:ok, counter_pid} =
      Agent.start_link(fn -> %{overall: overall_file_count, counter: 0} end)

    Replication.log(parameters, :info, "#{overall_file_count} files need replication.")

    Enum.each(
      uuid_lists_by_variant,
      fn {uuid_list, variant_name, local_variant_name} ->
        uuid_list
        |> Task.async_stream(
          fn uuid ->
            copy_file(%{
              uuid: uuid,
              variant_name: variant_name,
              local_variant_name: local_variant_name,
              headers: headers,
              base_url: base_file_url,
              counter_pid: counter_pid,
              publication: publication
            })
          end,
          timeout: 1000 * 60 * 5
        )
        |> Enum.to_list()
      end
    )

    {
      :ok,
      %{
        finished: :replicating_files,
        publication: publication,
        user_input: input
      }
    }
  end

  defp get_file_list(file_variant, base_url, headers) do
    Finch.build(
      :get,
      "#{base_url}?types[]=#{file_variant}",
      headers
    )
    |> Finch.request(FieldPublication.Finch, receive_timeout: 1000 * 60)
    |> case do
      {:ok, %Finch.Response{body: body, status: 200}} ->
        result =
          body
          |> Jason.decode!()
          |> Enum.reject(fn {_key, %{"deleted" => deleted}} ->
            deleted
          end)

        result

      {:ok, %Finch.Response{status: 401}} ->
        {:error, :invalid}

      {:ok, %Finch.Response{status: 404}} ->
        {:error, :not_found}
    end
  end

  defp copy_file(%{
         uuid: uuid,
         variant_name: variant_name,
         local_variant_name: local_variant_name,
         base_url: base_url,
         headers: headers,
         counter_pid: counter_pid,
         publication: publication
       }) do
    Finch.build(
      :get,
      "#{base_url}/#{uuid}?type=#{variant_name}",
      headers
    )
    |> Finch.request(FieldPublication.Finch, receive_timeout: 1000 * 60 * 5)
    |> case do
      {:ok, %Finch.Response{status: 200, body: data}} ->
        FileService.write_raw_data(publication.project_name, uuid, data, local_variant_name)
    end

    Agent.update(counter_pid, fn state -> Map.put(state, :counter, state[:counter] + 1) end)

    Publications.broadcast(
      publication,
      {
        :file_replication_count,
        Agent.get(counter_pid, fn state -> state end)
      }
    )
  end
end
