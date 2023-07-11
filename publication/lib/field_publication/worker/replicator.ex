defmodule FieldPublication.Worker.Replicator do
  alias FieldPublication.{
    CouchService,
    FileService
  }

  require Logger

  def replicate(source_url, source_project_name, source_user, source_password, project_name) do
    publication_name = "#{project_name}_publication-#{Date.utc_today()}"

    with {:ok, %Finch.Response{status: status_code}} when status_code == 200 or status_code == 201 <-
           CouchService.replicate(
             "#{source_url}/db/#{source_project_name}",
             source_user,
             source_password,
             publication_name
           ),
         {:ok, file_response} <-
           FileService.replicate(
             "#{source_url}/files/#{source_project_name}",
             source_user,
             source_password,
             publication_name
           ),
         {:ok, _} <- create_publication_metadata(project_name, publication_name) do
      CouchService.add_application_user(publication_name)

      %{
        couch_status: :ok,
        file_response: file_response,
        name: publication_name
      }
    else
      {:ok, %Finch.Response{status: 409} = error} ->
        Logger.error(error)
        :conflict

      error ->
        Logger.error(error)
        :error
    end
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

    CouchService.retrieve_document(project_name, "publications")
    |> case do
      {:ok, %Finch.Response{status: 404}} ->
        CouchService.store_document(project_name, "publications", metadata)
      {:ok, %Finch.Response{body: body, status: 200}} ->
        updated =
          body
          |> Jason.decode!()
          |> then(fn(existing) ->
            existing
            |> Map.merge(metadata)
          end)

        CouchService.store_document(project_name, "publications", updated)
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

  # defp flatten_full_configuration(%{"item" => item, "trees" => trees}, acc) do
  #   Enum.reduce(trees, acc ++ [item], &flatten_full_configuration/2)
  # end

  # defp parse_category(%{
  #        "color" => color,
  #        "description" => description,
  #        "label" => label,
  #        "name" => name,
  #        "groups" => groups
  #      }) do
  #   %{
  #     name: name,
  #     description: Enum.map(description, &parse_language_map/1),
  #     color: color,
  #     label: Enum.map(label, &parse_language_map/1),
  #     groups: Enum.map(groups, &parse_group/1)
  #   }
  # end

  # defp parse_group(%{"label" => label, "name" => name, "fields" => fields}) do
  #   %{
  #     label: Enum.map(label, &parse_language_map/1),
  #     name: name,
  #     fields: Enum.map(fields, &parse_field/1)
  #   }
  # end

  # defp parse_field(%{"description" => description, "label" => label, "name" => name}) do
  #   %{
  #     label: Enum.map(label, &parse_language_map/1),
  #     name: name,
  #     description: Enum.map(description, &parse_language_map/1)
  #   }
  # end

  # defp parse_language_map({key, value}) do
  #   %{String.to_atom(key) => value}
  # end
end
