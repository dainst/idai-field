defmodule FieldPublication.Replication.MetadataGeneration do

  alias FieldPublication.{
    CouchService,
    Schema.Publication,
    Schema.Project,
    Replication.Parameters
  }

  def create(
         %Parameters{
           source_url: source_url,
           source_project_name: source_project_name,
           local_project_name: project_name,
           comments: comments
         },
         publication_name
       ) do

    {:ok, full_config} = recombine_full_project_configuration(publication_name)

    configuration_doc_name = "#{publication_name}-config"

    CouchService.get_document(configuration_doc_name)
    |> case do
      {:ok, %{status: 404}} ->
        CouchService.put_document(%{id: configuration_doc_name, data: full_config})

      {:ok, %{status: 200, body: body}} ->
        %{"_rev" => rev} = Jason.decode!(body)
        CouchService.delete_document(configuration_doc_name, rev)
        CouchService.put_document(%{id: configuration_doc_name, data: full_config})
    end

    publication_metadata =
      %Publication{
        source_url: source_url,
        source_project_name: source_project_name,
        configuration_doc: configuration_doc_name,
        database: publication_name,
        draft_date: Date.utc_today(),
        comments: comments
      }

    Project.get_project!(project_name)
    |> Project.add_publication(publication_metadata)

    {:ok, :metadata_created}
  end

  defp recombine_full_project_configuration(publication_name) do
    {full_configuration, 0} = System.cmd(
      "node",
      [
        Application.app_dir(
          :field_publication,
          "priv/publication_enricher/dist/createFullConfiguration.js"
        ),
        publication_name,
        Application.get_env(:field_publication, :couchdb_url),
        Application.get_env(:field_publication, :couchdb_admin_name),
        Application.get_env(:field_publication, :couchdb_admin_password)
      ]
    )

    {:ok, Jason.decode!(full_configuration)}
  end
end
