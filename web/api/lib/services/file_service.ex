defmodule Api.Services.FileService do
  @root_path Application.compile_env(:api, :file_store_directory_root)

  require Logger

  def replicate(source_url, source_user, source_password, target_project_name) do

    Logger.debug("Replicating images of #{source_url} as #{target_project_name}")

    headers = [
      {"Content-Type", "application/json"},
      {"Authorization", "Basic #{"#{source_user}:#{source_password}" |> Base.encode64()}"}
    ]

    HTTPoison.get(source_url, headers)
    |> case do
      {:ok, %{status_code: 200, body: body}} ->
        target_path = "#{@root_path}/#{target_project_name}"

        File.mkdir_p!(target_path)

        result =
          body
          |> Jason.decode!()
          |> Stream.reject(fn {_key, value} ->
            case value do
              %{"deleted" => true} ->
                true

              _ ->
                false
            end
          end)
          |> Enum.map(&write_file(&1, source_url, headers, target_path))

        {:ok, result}

      {:ok, %{status_code: 401}} ->
        {:error, :unauthorized}

      {:ok, %{status_code: 404}} ->
        {:error, :not_found}
    end
  end

  defp write_file({uuid, %{"variants" => variants}}, url, headers, project_directory) do
    status =
      variants
      |> Enum.map(fn %{"name" => variant_name} ->
        file_path = "#{project_directory}/#{variant_name}/#{uuid}"

        unless File.exists?(file_path) do
          HTTPoison.get("#{url}/#{uuid}?type=#{variant_name}", headers)
          |> case do
            {:ok, %{status_code: 200, body: data}} ->
              File.mkdir_p!("#{project_directory}/#{variant_name}")
              %{variant_name => File.write!(file_path, data)}
          end
        end
      end)

    %{uuid: uuid, status: status}
  end
end
