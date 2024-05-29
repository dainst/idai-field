defmodule Api.Project do
  alias Api.Services.{
    CouchService,
    FileService
  }

  require Logger

  @translation_db_suffix "_translations"
  @styles_db_suffix "_styles"

  @date_pattern ~r/^(?<db>.*)-(?<version>\d{4}-\d{2}-\d{2})$/

  def index() do
    CouchService.get_all_databases()
    |> Stream.filter(fn name ->
      cond do
        String.ends_with?(name, @translation_db_suffix) ->
          false

        String.ends_with?(name, @styles_db_suffix) ->
          false

        true ->
          true
      end
    end)
    |> Stream.map(fn name ->
      Regex.named_captures(@date_pattern, name)
    end)
    |> Enum.reduce(%{}, fn %{"db" => database_name, "version" => version}, acc ->
      Map.update(acc, database_name, %{versions: [version]}, fn versions ->
        versions ++ [version]
      end)
    end)
  end

  def replicate(source_url, source_project_name, source_user, source_password, project_name) do
    target_project_name = "#{project_name}-#{Date.utc_today()}"

    with {:ok, %{status_code: value}} when value == 200 or value == 201 <-
           CouchService.replicate(
             "#{source_url}/db/#{source_project_name}",
             source_user,
             source_password,
             target_project_name
           ),
         {:ok, file_response} <-
           FileService.replicate(
             "#{source_url}/files/#{source_project_name}",
             source_user,
             source_password,
             target_project_name
           ) |> IO.inspect(),
         :ok <- create_project_metadata(target_project_name) do
      %{
        couch_status: :ok,
        file_response: file_response,
        name: target_project_name
      }
    else
      {:ok, %HTTPoison.Response{status_code: 409} = error} ->
        Logger.error(error)
        :conflict

      error ->
        Logger.error(error)
        :error
    end
  end

  defp create_project_metadata(project_name) do
    url = Application.get_env(:api, :couchdb_url)

    translations_database = "#{project_name}#{@translation_db_suffix}"
    styles_database = "#{project_name}#{}"

    with {:ok, %{status_code: val}} when val == 201 or val == 412 <-
           CouchService.create_database(translations_database),
         {:ok, %{status_code: val}} when val == 201 or val == 412 <-
           CouchService.create_database(styles_database),
         {:ok, full_config} <- create_full_configuration(url, project_name),
         flattened_categories <-
           Enum.reduce(full_config, [], &flatten_full_configuration/2) do
      flattened_categories
      |> Enum.map(&parse_category/1)
      |> Enum.map(fn parsed_category ->
        # Ugly split between translations and :color
        CouchService.store_document(
          translations_database,
          "category_#{parsed_category.name}",
          Map.delete(parsed_category, :color)
        )

        CouchService.store_document(
          styles_database,
          "category_#{parsed_category.name}",
          %{color: Map.get(parsed_category, :color)}
        )
      end)

      :ok
    else
      error ->
        Logger.error(error)
        :error
    end
  end

  defp create_full_configuration(url, project_name) do
    System.cmd(
      "node",
      [
        Application.app_dir(
          :api,
          "priv/project_enricher/dist/createFullConfiguration.js"
        ),
        project_name,
        url,
        Application.get_env(:api, :couchdb_admin_name),
        Application.get_env(:api, :couchdb_admin_password)
      ]
    )
    |> case do
      {full_configuration, 0} ->
        {:ok, Jason.decode!(full_configuration)}
    end
  end

  defp flatten_full_configuration(%{"item" => item, "trees" => trees}, acc) do
    Enum.reduce(trees, acc ++ [item], &flatten_full_configuration/2)
  end

  defp parse_category(%{
         "color" => color,
         "description" => description,
         "label" => label,
         "name" => name,
         "groups" => groups
       }) do
    %{
      name: name,
      description: Enum.map(description, &parse_language_map/1),
      color: color,
      label: Enum.map(label, &parse_language_map/1),
      groups: Enum.map(groups, &parse_group/1)
    }
  end

  defp parse_group(%{"label" => label, "name" => name, "fields" => fields}) do
    %{
      label: Enum.map(label, &parse_language_map/1),
      name: name,
      fields: Enum.map(fields, &parse_field/1)
    }
  end

  defp parse_field(%{"description" => description, "label" => label, "name" => name}) do
    %{
      label: Enum.map(label, &parse_language_map/1),
      name: name,
      description: Enum.map(description, &parse_language_map/1)
    }
  end

  defp parse_language_map({key, value}) do
    %{String.to_atom(key) => value}
  end
end
