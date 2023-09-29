defmodule FieldPublication.Replication.MetadataGeneration do
  alias FieldPublication.CouchService

  alias FieldPublication.Schemas.Publication

  def reconstruct_project_konfiguraton(%Publication{
        database: database_name,
        configuration_doc: configuration_doc_name
      }) do
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
        Jason.decode!(full_configuration)
      end)

    CouchService.get_document(configuration_doc_name)
    |> case do
      {:ok, %{status: 404}} ->
        CouchService.put_document(%{id: configuration_doc_name, data: full_config})

      {:ok, %{status: 200, body: body}} ->
        %{"_rev" => rev} = Jason.decode!(body)
        CouchService.delete_document(configuration_doc_name, rev)
        CouchService.put_document(%{id: configuration_doc_name, data: full_config})
    end

    {:ok, :configuration_reconstructed}
  end
end
